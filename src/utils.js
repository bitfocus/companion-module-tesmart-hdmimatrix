const { InstanceStatus, TCPHelper } = require('@companion-module/base');

module.exports = {
	initTCP: function() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('error', (err) => {
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure);
			})

			this.socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Ok);
			})

			this.socket.on('data', (receivebuffer) => {
				this.processResponse(receivebuffer)
			})
		}
	},

	/*
	example responses from switch:

	LINK:O1I1;O2I2;O3I3;O4I4;O5I4;O6I6;O7I7;O8I4;END

	*/
	processResponse: function(receivebuffer) {
		let index = 0
		if (this.config.log_responses) {
			this.log('info', 'Response: ' + receivebuffer)
		}
		if (this.config.polled_data) {
			// convert buffer to string and then into lines, removing blank lines
			let lines = receivebuffer
				.toString('utf8')
				.split(/[\r?\n]+/)
				.filter((element) => element)
			//console.log(lines)
			if (lines.length > 0) {
				for (index = 0; index < lines.length; index++) {
					if (lines[index].length > 0) {
						if (lines[index].includes('LINK:O') && lines[index].includes(';END')) {
							const tokens = lines[index].slice(5).slice(0,-3).split(';') //remove LINK: and END and split to tokens
							if (this.config.log_tokens) {
								this.log('info', 'Local Tokens: ' + tokens)
							}
							//console.log('Tokens: ' + tokens)
							for (let token of tokens) {
								if (token.length > 0) {
									this.updateRoute(token.charAt(1), token.charAt(3))
								}
							}
						}
					}
				}
				this.checkFeedbacks()
			}
		}
	},

	sendCommmand: function(cmd) {
		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.isConnected) {
				this.socket.send(cmd + '\r\n')
			} else {
				this.log('debug', 'Socket not connected :(');
			}
		}
	},

	initPolling: function() {
		// read switch state, possible changes using controls on the unit or web interface
		if (this.pollMixerTimer === undefined) {
			this.pollMixerTimer = setInterval(() => {
				this.sendCommmand('MT00RD0000NT')
			}, this.config.poll_interval)
		}
	},

	updateMatrixVariables: function() {

		this.CHOICES_INPUTS.forEach((input) => {
			let list = ''
			for (let key in this.outputRoute) {
				if (this.outputRoute[key] == input.id) {
					list += key + '.'
				}
			}
			let variableObj = {};
			variableObj[`input_route${input.id}`] = list;
			this.setVariableValues(variableObj);
		})
	},

	updateRoute: function(output, input) {
		this.outputRoute[output] = input

		let variableObj = {};
		variableObj[`output_route${output}`] = input;
		this.setVariableValues(variableObj);
		this.updateMatrixVariables()
	},

	initArrays: function(inChannels, outChannels, presets) {
		this.CHOICES_INPUTS = []
		this.CHOICES_OUTPUTS = []
		this.CHOICES_PRESETS = []
		this.outputRoute = {}

		if (inChannels > 0) {
			for (let i = 1; i <= inChannels; i++) {
				let channelObj = {}
				channelObj.id = i
				channelObj.label = i
				this.CHOICES_INPUTS.push(channelObj)
			}
		}
		if (outChannels > 0) {
			for (let i = 1; i <= outChannels; i++) {
				let channelObj = {}
				channelObj.id = i
				channelObj.label = i
				this.CHOICES_OUTPUTS.push(channelObj)
				this.outputRoute[i] = i
			}
		}
		for (let i = 1; i <= presets; i++) {
			let channelObj = {}
			channelObj.id = i
			channelObj.label = i
			this.CHOICES_PRESETS.push(channelObj)
		}
	}
}