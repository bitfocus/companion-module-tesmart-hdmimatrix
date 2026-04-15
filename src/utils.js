const { InstanceStatus, TCPHelper } = require('@companion-module/base');

module.exports = {
	initTCP: function() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.receiveBuffer = ''

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
		const chunk = receivebuffer.toString('utf8')
		
		if (this.config.log_responses) {
			this.log('info', 'Raw chunk: ' + chunk)
		}

		this.receiveBuffer = (this.receiveBuffer || '') + chunk

		let updated = false
		let endIndex = this.receiveBuffer.indexOf(';END')

		while (endIndex !== -1) {
			const rawMessage = this.receiveBuffer.slice(0, endIndex + 4)
			this.receiveBuffer = this.receiveBuffer.slice(endIndex + 4)

			const startIndex = rawMessage.indexOf('LINK:')

			if (startIndex !== -1){
				const message = rawMessage.slice(startIndex)

				if (message.startsWith('LINK:O')) {
					const body = message.slice(5, -4)
					const tokens = body.split(';').filter((token) => token.length > 0)

					if (this.config.log_tokens) {
						this.log('info', 'Response Tokens: ' + JSON.stringify(tokens))
					}

					for (const token of tokens) {
						const match = token.match(/^O(\d+)I(\d+)$/)
						if (match) {
							this.updateRoute(match[1], match[2])
							updated = true
						}
					}
				}
			}

			endIndex = this.receiveBuffer.indexOf(';END')
		}

		if (updated) {
			this.checkFeedbacks()
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
		this.checkFeedbacks()
	},

	initArrays: function(inChannels, outChannels, presets) {
		this.CHOICES_INPUTS = []
		this.CHOICES_OUTPUTS = []
		this.CHOICES_PRESETS = []
		this.outputRoute = {}

		if (inChannels > 0) {
			for (let i = 1; i <= inChannels; i++) {
				let channelObj = {}
				channelObj.id = String(i)
				channelObj.label = String(i)
				this.CHOICES_INPUTS.push(channelObj)
			}
		}
		if (outChannels > 0) {
			for (let i = 1; i <= outChannels; i++) {
				let channelObj = {}
				channelObj.id = String(i)
				channelObj.label = String(i)
				this.CHOICES_OUTPUTS.push(channelObj)
				this.outputRoute[String(i)] = null
			}
		}
		for (let i = 1; i <= presets; i++) {
			let channelObj = {}
			channelObj.id = String(i)
			channelObj.label = String(i)
			this.CHOICES_PRESETS.push(channelObj)
		}
	}
}