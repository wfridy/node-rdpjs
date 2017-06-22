/*
 * Copyright (c) 2014-2015 Sylvain Peyrefitte
 *
 * This file is part of node-rdpjs.
 *
 * node-rdpjs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var Logger = require('bunyan');
var azure = require('az-bunyan');
var azureStorage = require('azure-storage');

var Levels = {
	'DEBUG': 1,
	'INFO': 2,
	'WARN': 3,
	'ERROR': 4
};

var configureAzureStorage = function configureAzureStorage() {
	var success = true;

	try {
		if (!process.env.applog_connectionstring || !process.env.applog_table) {
			success = false;
		}
		else {
			// Create storage for applogs
			var appLogTableService = azureStorage.createTableService(process.env.applog_connectionstring);
			appLogTableService.createTableIfNotExists(process.env.applog_table, function (error, result, response) {
				if (error) {
					success = false;
				}
			});
		}
	}
	catch (err) {
		success = false;
	}

	return success;
};

var appStorageAvailable = configureAzureStorage();
var logger = undefined;
if (appStorageAvailable) {
	// Create main application logger
	var azureAppLogStream = azure.createTableStorageStream(process.env.log_level, {
		connectionString: process.env.applog_connectionstring,
		tableName: process.env.applog_table
	});

	//Remove the next line when az-bunyan fixes createTableStorageStream to assign the log_level.
	azureAppLogStream.level = process.env.log_level;

	logger = Logger.createLogger({
		name: 'node-rdpjs',
		streams: [azureAppLogStream]
	});
}
else {
	logger = Logger.createLogger({
		name: 'node-rdpjs',
		streams: [
			{
				type: 'rotating-file',
				period: '1d',
				count: 2,
				path: `node-rdpjs${process.pid}.log`,
				level: process.env.log_level
			},
			{
				stream: process.stderr,
				level: process.env.log_level
			}
		]
	});
}

function log(level, message) {
	if (Levels[level] < module.exports.level) return;
	console.log("[node-rdpjs] " + level + ":\t" + message);
}

/**
 * Module exports
 */
module.exports = {
	level: Levels.INFO,
	Levels: Levels,
	debug: function (message) { logger.debug(message); },
	info: function (message) { logger.info(message); },
	warn: function (message) { logger.warn(message); },
	error: function (message) { logger.error(message); }
};