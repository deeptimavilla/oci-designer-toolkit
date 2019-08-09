#!/usr/bin/python
# Copyright (c) 2013, 2014-2019 Oracle and/or its affiliates. All rights reserved.


"""Provide Module Description
"""

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
__author__ = ["Andrew Hopkinson (Oracle Cloud Solutions A-Team)"]
__copyright__ = "Copyright (c) 2013, 2014-2019  Oracle and/or its affiliates. All rights reserved."
__ekitversion__ = "@VERSION@"
__ekitrelease__ = "@RELEASE@"
__version__ = "1.0.0.0"
__date__ = "@BUILDDATE@"
__status__ = "@RELEASE@"
__module__ = "ociCommon"
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


from contextlib import closing
import copy
import itertools
import jinja2
import json
import locale
import logging
import logging.handlers
import os
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import yaml
import zipfile

from common.ociLogging import getLogger

# Configure logging
logger = getLogger()

def expandNestedVars(varsyaml):
    varsstr = yaml.dump(varsyaml)
    while True:
        logger.debug("vars yaml : %s", yaml.dump(varsyaml))
        curr = jinja2.Template(varsstr).render(**varsyaml)
        if curr != varsstr:
            varsstr = curr
            varsyaml = yaml.load(varsstr)
        else:
            return yaml.load(varsstr)


def parseJsonString(jsonstring):
    try:
        jsonData = json.loads(jsonstring)
        return jsonData
    except json.decoder.JSONDecodeError as err:
        # Silently ignore and return the string because it is not json.
        return jsonstring


# Read JSON file
def readJsonFile(filename, varsyaml=None, templates='/pcma/templates', **kwargs):
    jsonData = None
    logger.info('Reading Json File : {0!s:s}'.format(filename))
    logger.debug('Templates : {0!s:s}'.format(templates))
    try:
        if varsyaml is not None:
            varsyaml = expandNestedVars(varsyaml)
            loader = jinja2.FileSystemLoader(searchpath=templates)
            env = jinja2.Environment(loader=loader)
            jsontemplate = env.get_template(filename)
            rendered = jsontemplate.render(varsyaml)
            logger.debug("Rendered File ===>")
            logger.debug(rendered)
            jsonData = json.loads(rendered)
            logJson(jsonData)
        else:
            with closing(open(str(filename))) as jsonFile:
                jsonData = json.load(jsonFile)
                logJson(jsonData)
    except (ValueError, TypeError) as err:
        msg = 'Failed to Read JSON File "{0:s}". {1:s}'.format(filename, str(err))
        logger.error('ValueError: %s', err)
        raise Exception(msg)
    except IOError as err:
        msg = 'JSON File "{0:s}" does not exist'.format(str(filename))
        logger.error('IOError: %s', err)
        raise Exception(msg)
    return jsonData


def writeJsonFile(jsonData, filename, sortKeys=True, **kwargs):
    logger.info('Writing Json File : {0!s:s}'.format(filename))
    dir = os.path.dirname(filename)
    if len(dir) > 0 and not os.path.exists(dir):
        os.makedirs(dir)
    with closing(open(filename, 'w')) as outfile:
        json.dump(jsonData, outfile, ensure_ascii=True, sort_keys=sortKeys, indent=2, separators=(',', ': '))
    logger.debug(jsonData)
    return


def logJson(jsonObj, sortKeys=True, indent=2, **kwargs):
    if jsonObj is not None:
        logger.info(json.dumps(jsonObj, sort_keys=sortKeys, indent=indent, separators=(',', ': ')))
    return


def readYamlFile(filename):
    logger.info('Reading Yaml File : {0!s:s}'.format(filename))
    yamlData = None
    with closing(open(filename)) as stream:
        try:
            yamlData = yaml.safe_load(stream)
        except yaml.YAMLError as err:
            logger.warn('Failed to Read YAML File %s', filename)
    return yamlData


def writeYamlFile(yamlData, filename, allowUnicode=True, defaultFlowStyle=False, defaultStyle='"', **kwargs):
    logger.info('Writing Yaml File : {0!s:s}'.format(filename))
    with closing(open(filename, 'w')) as stream:
        stream.write(yaml.safe_dump(yamlData, allow_unicode=allowUnicode, default_flow_style=defaultFlowStyle, default_style=defaultStyle))
    return


def logYaml(yamlObj, allowUnicode=True, defaultFlowStyle=False, **kwargs):
    if yamlObj is not None:
        logger.debug(yaml.safe_dump(yamlObj, allow_unicode=allowUnicode, default_flow_style=defaultFlowStyle))
    return


def readXmlFile(filename):
    logger.info('Reading Xml File : {0!s:s}'.format(filename))
    tree = None
    try:
        tree = ET.parse(filename)
    except IOError as e:
        logger.warn('Failed to Read XML File %s', filename)
    return tree


def writeXmlFile(tree, filename):
    logger.info('Writing Xml File : {0!s:s}'.format(filename))
    tree.write(filename)


def writeTerraformFile(terraform_file, contents, **kwargs):
    logger.info('Writing Terraform File: {0:s}'.format(terraform_file))
    with closing(open(terraform_file, 'w')) as f:
        for resource in contents:
            f.write('{0:s}\n'.format(resource))
    return


def writeAnsibleFile(ansible_file, contents, **kwargs):
    logger.info('Writing Ansible File: {0:s}'.format(ansible_file))
    with closing(open(ansible_file, 'w')) as f:
        for resource in contents:
            f.write('{0:s}\n'.format(resource))
    return


def writePythonFile(python_file, contents, **kwargs):
    logger.info('Writing Python File: {0:s}'.format(python_file))
    with closing(open(python_file, 'w')) as f:
        f.write('{0:s}\n'.format(contents))
    return


def standardiseIds(json_data={}, from_char='.', to_char='-', **kwargs):
    if isinstance(json_data, dict):
        for key, val in json_data.items():
            logger.info(key)
            if isinstance(val, dict):
                json_data[key] = standardiseIds(val, from_char, to_char)
            elif key == 'id' or key.endswith('_id') or key.endswith('_ids'):
                if isinstance(val, list):
                    json_data[key] = [id.replace(from_char, to_char) for id in val]
                else:
                    json_data[key] = val.replace(from_char, to_char)
            elif isinstance(val, list):
                json_data[key] = [standardiseIds(element, from_char, to_char) for element in val]
    elif isinstance(json_data, list):
        json_data = [standardiseIds(element, from_char, to_char) for element in json_data]
    return json_data