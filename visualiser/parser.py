#!/usr/bin/python
# Copyright (c) 2013, 2014-2019 Oracle and/or its affiliates. All rights reserved.


"""Provide Module Description
"""

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
__author__ = ["Andrew Hopkinson (Oracle Cloud Solutions A-Team)"]
__copyright__ = "Copyright (c) 2013, 2014-2019  Oracle and/or its affiliates. All rights reserved."
__version__ = "1.0.0.0"
__date__ = "@BUILDDATE@"
__status__ = "@RELEASE@"
__module__ = "xmlparser.py"
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


import datetime
import getopt
import json
import locale
import logging
import operator
import os
import requests
import sys

from parsers.ociDrawioXMLParser import OCIDrawIoXMLParser
from common.ociValidation import validateVisualiserJson
from common.ociExceptions import ValidationException
from common.ociCommon import writeJsonFile
from common.ociCommon import logJson
from common.ociLogging import getLogger

# Configure logging
logger = getLogger()

supported_sources = ["drawio"]

# Execute workflow
def processWorkflow(args):
    if not os.path.exists(args['inputfile']):
        logger.error('Input File "{0:s}" does not exist.'.format(args['inputfile']))
    elif os.path.exists(args['inputfile']) and not os.path.isfile(args['inputfile']):
        logger.error('Input File Name "{0:s}" exists but is not a file.'.format(args['inputfile']))
    elif os.path.exists(args['outputfile']) and not os.path.isfile(args['outputfile']):
        logger.error('Output File Name "{0:s}" exists but is not a file.'.format(args['outputfile']))
    elif args['outputfile'] is None or len(args['outputfile']) == 0:
        logger.error('Output File Name must be specified.')
    else:
        oci_json = None
        if args["source"] == 'drawio':
            input_parser = OCIDrawIoXMLParser(args['inputfile'])
            input_parser.parse()
            oci_json = input_parser.getJson()
            logger.debug(oci_json)
            logJson(oci_json)
        else:
            logger.warn('Unsupported source {0:s}. Supported source type {1:s}'.format(args['source'], ','.join(supported_sources)))
        if oci_json is not None:
            validateVisualiserJson(oci_json)
            writeJsonFile(oci_json, args['outputfile'])
    return


# Set default values for Args
def defaultArgs():
    args = {}
    args['inputfile'] = ""
    args['outputfile'] = ""
    args['source'] = "drawio"
    return args


# Read Module Arguments
def readargs(opts, args):
    moduleargs = defaultArgs()

    # Read Module Command Line Arguments.
    for opt, arg in opts:
        if opt in ("-f", "--inputfile"):
            moduleargs['inputfile'] = arg
        elif opt in ("-o", "--outputfile"):
            moduleargs['outputfile'] = arg
        elif opt in ("-s", "--source"):
            moduleargs['source'] = arg

    return moduleargs


# Main processing function
def main(argv):
    # Configure Parameters and Options
    options = 'f:o:s:'
    longOptions = ['inputfile=', 'outputfile=', 'source=']
    # Get Options & Arguments
    try:
        opts, args = getopt.getopt(argv, options, longOptions)
        # Read Module Arguments
        moduleargs = readargs(opts, args)
        processWorkflow(moduleargs)
    except getopt.GetoptError:
        usage()
    except Exception as e:
        print('Unknown Exception please check log file')
        logger.exception(e)
        sys.exit(1)

    return


# Main function to kick off processing
if __name__ == "__main__":
    main(sys.argv[1:])