const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will connect to a TESmart HDMI MATRIX',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				width: 6,
				default: '192.168.0.3',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'IP Port',
				width: 6,
				default: '5000',
				regex: Regex.PORT,
			},
			{
				type: 'dropdown',
				id: 'outChannels',
				label: 'Number of output channels',
				default: '8',
				choices: [
					{ id: '2', label: '2' },
					{ id: '4', label: '4' },
					{ id: '8', label: '8' },
					{ id: '16', label: '16' },
				],
			},
			{
				type: 'dropdown',
				id: 'inChannels',
				label: 'Number of input channels',
				default: '8',
				choices: [
					{ id: '4', label: '4' },
					{ id: '8', label: '8' },
					{ id: '16', label: '16' },
				],
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Polling Interval (ms)',
				min: 300,
				max: 30000,
				default: 1000,
				width: 8,
			},
			{
				type: 'checkbox',
				id: 'polled_data',
				label: 'Use polled data from unit    :',
				default: true,
				width: 8,
			},
			{
				type: 'checkbox',
				id: 'log_responses',
				label: 'Log returned data    :',
				default: false,
				width: 8,
			},
			{
				type: 'checkbox',
				id: 'log_tokens',
				label: 'Log token data    :',
				default: false,
				width: 8,
			},
		]
	},
}