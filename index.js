//TESMART HDMI Matrix

var tcp           = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.status(self.STATE_OK);
};

instance.prototype.init = function() {
	var self = this;
	self.status(self.STATE_OK);
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			width: 2,
			default: 5000,
			regex: self.REGEX_PORT
        }
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug('destroy', self.id);
};

instance.prototype.actions = function(system) {
	var self = this;

	self.setActions({
		'sendToAllOutputs': {
			label: 'Send Input to All Outputs',
			options: [
				{
					type: 'number',
					label: 'Input',
					id: 'input',
					min: 1,
					max: 8,
					default: 1,
					required: true,
					range: true
			   	}
			]
		},
		'sendInputToOutput': {
			label: 'Send Input to Output',
			options: [
				{
					type: 'number',
					label: 'Input',
					id: 'input',
					min: 1,
					max: 8,
					default: 1,
					required: true,
					range: true
			   	},
				{
					type: 'number',
					label: 'Output',
					id: 'output',
					min: 1,
					max: 8,
					default: 1,
					required: true,
					range: true
			   	}
			]
		},
		'loadPreset': {
			label: 'Load Preset',
			options: [
				{
					type: 'number',
					label: 'Preset',
					id: 'preset',
					min: 1,
					max: 8,
					default: 1,
					required: true,
					range: true
			   	}
			]
		},
		'savePreset': {
			label: 'Savre Preset',
			options: [
				{
					type: 'number',
					label: 'Preset',
					id: 'preset',
					min: 1,
					max: 8,
					default: 1,
					required: true,
					range: true
			   	}
			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd;

	switch(action.action) {
		case 'sendToAllOutputs':
			cmd = 'MT00SW' + 0 + action.options.input + '00NT';
			break;
		case 'sendInputToOutput':
			cmd = 'MT00SW' + 0 + action.options.input + 0 + action.options.output + 'NT';
			break;
		case 'loadPreset':
			cmd = 'MT00RD01' + 0 + action.options.preset + 'NT';
			break;
		case 'savePreset':
			cmd = 'MT00SV00' + 0 + action.options.preset + 'NT';
			break;
	}

	if (cmd !== undefined) {		
		if (self.socket !== undefined) {
			self.socket.destroy();
			delete self.socket;
		}

		self.status(self.STATE_WARNING, 'Connecting');

		if (self.config.host) {
			self.socket = new tcp(self.config.host, self.config.port);

			self.socket.on('error', function (err) {
				if (err.toString().indexOf('ECONNREFUSED') > -1) {
					self.debug('Network error: Unable to connect to device:' + self.config.host);
					self.log('error','Network error: Unable to connect to device:' + self.config.host);
				}
				else {
					self.debug('Network error (' + self.config.host + ')', err);
					self.log('error','Network error: ' + err);
				}
				
				self.status(self.STATE_ERROR, err);
				self.socket.destroy();
				delete self.socket;
			});

			self.socket.on('connect', function () {
				self.debug('Connected (' + self.config.host + ')');
				self.debug('Turning outlet ' + action.action + ': ' + self.config.host);
				self.socket.send(Buffer.from(cmd, 'hex'));
				self.socket.send(Buffer.from('\r\n'));
				self.socket.destroy();
				delete self.socket;
				self.status(self.STATE_OK);
			});
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
