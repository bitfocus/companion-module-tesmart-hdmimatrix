// TESmart HDMI MATRIX SWITCH
// remove console.log

let tcp = require('../../tcp')
let instance_skel = require('../../instance_skel')
//const { stubFalse } = require('lodash')

var debug
var log

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)

		this.CHOICES_INPUTS = []
		this.CHOICES_OUTPUTS = []
		this.CHOICES_PRESETS = []

		this.pollMixerTimer = undefined
		this.selectedInput = 1
		this.outputRoute = {}
	}

	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.pollMixerTimer !== undefined) {
			clearInterval(this.pollMixerTimer)
			delete this.pollMixerTimer
		}

		debug('destroy', this.id)
	}

	init() {
		debug = this.debug
		log = this.log
		this.updateConfig(this.config)
	}

	updateConfig(config) {
		// polling is running and polling may have been de-selected by config change
		if (this.pollMixerTimer !== undefined) {
			clearInterval(this.pollMixerTimer)
			delete this.pollMixerTimer
		}
		this.config = config

		this.config.polling_interval = this.config.polling_interval !== undefined ? this.config.polling_interval : 750
		this.config.port = this.config.port !== undefined ? this.config.port : 23

		this.initArrays(this.config.inChannels, this.config.outChannels, 8)
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.init_tcp()
		this.initPolling()
		this.initPresets()
	}

	init_tcp() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.host) {
			this.socket = new tcp(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.status(status, message)
			})

			this.socket.on('error', (err) => {
				debug('Network error', err)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('connect', () => {
				debug('Connected')
			})

			this.socket.on('data', (receivebuffer) => {
				this.processResponse(receivebuffer)
			})
		}
	}
	/*
	example responses from switch:
						
	LINK:O1I1;O2I2;O3I3;O4I4;O5I4;O6I6;O7I7;O8I4;END			
					
	*/
	processResponse(receivebuffer) {
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
	}

	sendCommmand(cmd) {
		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(cmd + '\r\n')
			} else {
				debug('Socket not connected :(')
			}
		}
	}

	initPolling() {
		// read switch state, possible changes using controls on the unit or web interface
		if (this.pollMixerTimer === undefined) {
			this.pollMixerTimer = setInterval(() => {
				this.sendCommmand('MT00RD0000NT')
			}, this.config.poll_interval)
		}
	}

	updateMatrixVariables() {

		this.CHOICES_INPUTS.forEach((input) => {
			let list = ''
			for (let key in this.outputRoute) {
				if (this.outputRoute[key] == input.id) {
					list += key + '.'
				}
			}
			this.setVariable(`input_route${input.id}`, list)
		})
	}

	updateRoute(output, input) {
		console.log('UR: ' + output + ' : ' + input)
		this.outputRoute[output] = input
		this.setVariable(`output_route${output}`, input)
		this.updateMatrixVariables()
		//console.log(this.outputRoute)
	}

	initArrays(inChannels, outChannels, presets) {
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

	initVariables() {
		let variables = []
		this.CHOICES_INPUTS.forEach((item) => {
			variables.push({
				label: `Input ${item.id}`,
				name: `input_route${item.id}`,
			})
		})
		this.CHOICES_OUTPUTS.forEach((item) => {
			variables.push({
				label: `Output ${item.id}`,
				name: `output_route${item.id}`,
			})
		})
		this.setVariableDefinitions(variables)
		this.CHOICES_OUTPUTS.forEach((output) => {
			this.setVariable(`output_route${output.id}`, this.outputRoute[output.id])
		})
		this.updateMatrixVariables()
	}

	config_fields() {
		return [
			{
				type: 'text',
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
				regex: this.REGEX_IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'IP Port',
				width: 6,
				default: '5000',
				regex: this.REGEX_PORT,
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
	}

	initActions() {
		let actions = {
			select_input: {
				label: 'Select Input',
				options: [
					{
						type: 'dropdown',
						label: 'Input Port',
						id: 'input',
						default: '1',
						choices: this.CHOICES_INPUTS,
					},
				],
			},
			switch_output: {
				label: 'Switch Output',
				options: [
					{
						type: 'dropdown',
						label: 'Output Port',
						id: 'output',
						default: '1',
						choices: this.CHOICES_OUTPUTS,
					},
				],
			},
			sendInputToOutput: {
				label: 'Input to Output',
				options: [
					{
						type: 'dropdown',
						label: 'Output Port',
						id: 'output',
						default: '1',
						choices: this.CHOICES_OUTPUTS,
					},
					{
						type: 'dropdown',
						label: 'Input Port',
						id: 'input',
						default: '1',
						choices: this.CHOICES_INPUTS,
					},
				],
			},
			sendToAllOutputs: {
				label: 'All outputs to selected input',
				options: [
					{
						type: 'checkbox',
						label: 'Use selected (or defined input)',
						id: 'selected',
						default: false,
					},
					{
						type: 'dropdown',
						label: 'Input Port',
						id: 'input',
						default: '1',
						choices: this.CHOICES_INPUTS,
					},
				],
			},
			mirror: {
				label: 'Mirror each output to input',
			},
			loadPreset: {
				label: 'Recall routes from preset number',
				options: [
					{
						type: 'dropdown',
						label: 'Preset number',
						id: 'preset',
						default: '1',
						choices: this.CHOICES_PRESETS,
					},
				],
			},
			savePreset: {
				label: 'Save current routes to preset number',
				options: [
					{
						type: 'dropdown',
						label: 'Preset number',
						id: 'preset',
						default: '1',
						choices: this.CHOICES_PRESETS,
					},
				],
			},
			buzzerON: {
				label: 'Buzzer On',
			},
			buzzerOFF: {
				label: 'Buzzer Off',
			},
		}
		this.setActions(actions)
	}

	action(action) {
		let options = action.options
		switch (action.action) {
			case 'select_input':
				this.selectedInput = options.input
				break
			case 'switch_output':
				this.sendCommmand(
					'MT00SW' + this.selectedInput.toString().padStart(2, '0') + options.output.toString().padStart(2, '0') + 'NT'
				)
				this.updateRoute(options.output, this.selectedInput)
				break
			case 'sendInputToOutput':
				this.sendCommmand(
					'MT00SW' + options.input.toString().padStart(2, '0') + options.output.toString().padStart(2, '0') + 'NT'
				)
				this.updateRoute(options.output, options.input)
				break
			case 'mirror':
				this.sendCommmand('MT00SW0000NT')
				break
			case 'sendToAllOutputs':
				let myInput = this.selectedInput
				if (!options.selected) {
					myInput = options.input
				}
				this.sendCommmand('MT00SW' + myInput.toString().padStart(2, '0') + '00NT')
				break
			case 'loadPreset':
				this.sendCommmand('MT00RD01' + options.preset.toString().padStart(2, '0') + 'NT')
				break
			case 'savePreset':
				this.sendCommmand('MT00SV00' + options.preset.toString().padStart(2, '0') + 'NT')
				break
			case 'buzzerON':
				this.sendCommmand('MT00BZEN00NT')
				break
			case 'buzzerOFF':
				this.sendCommmand('MT00BZEN01NT')
				break
		} // note that internal status values are set immediately for feedback responsiveness and will be updated again when the unit responds to polling (hopefully with the same value!)
		this.checkFeedbacks()
	}

	initFeedbacks() {
		let feedbacks = {}

		feedbacks['selected'] = {
			type: 'boolean',
			label: 'Status for input',
			description: 'Show feedback selected input',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '1',
					choices: this.CHOICES_INPUTS,
				},
			],
			style: {
				color: this.rgb(0, 0, 0),
				bgcolor: this.rgb(255, 0, 0),
			},
			callback: (feedback, bank) => {
				let opt = feedback.options
				if (this.selectedInput == opt.input) {
					return true
				} else {
					return false
				}
			},
		}
		feedbacks['output'] = {
			type: 'boolean',
			label: 'Status for output',
			description: 'Show feedback selected output',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					default: '1',
					choices: this.CHOICES_OUTPUTS,
				},
			],
			style: {
				color: this.rgb(0, 0, 0),
				bgcolor: this.rgb(0, 255, 0),
			},
			callback: (feedback, bank) => {
				let opt = feedback.options
				if (this.outputRoute[opt.output] == this.selectedInput) {
					return true
				} else {
					return false
				}
			},
		}

		this.setFeedbackDefinitions(feedbacks)
		this.checkFeedbacks()
	}
	initPresets() {
		let presets = []

		const aSelectPreset = (input) => {
			return {
				category: 'Select Input',
				label: 'Select',
				bank: {
					style: 'text',
					text: `In ${input}\\n> $(${this.config.label}:input_route${input})`,
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
				},
				actions: [
					{
						action: 'select_input',
						options: {
							input: input,
						},
					},
				],
				feedbacks: [
					{
						type: 'selected',
						options: {
							input: input,
						},
						style: {
							color: this.rgb(0, 0, 0),
							bgcolor: this.rgb(255, 0, 0),
						},
					},
				],
			}
		}
		const aSwitchPreset = (output) => {
			return {
				category: 'Switch Output',
				label: 'Switch',
				bank: {
					style: 'text',
					text: `Out ${output}\\n< $(${this.config.label}:output_route${output})`,
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
				},
				actions: [
					{
						action: 'switch_output',
						options: {
							output: output,
						},
					},
				],
				feedbacks: [
					{
						type: 'output',
						options: {
							output: output,
						},
						style: {
							color: this.rgb(0, 0, 0),
							bgcolor: this.rgb(0, 255, 0),
						},
					},
				],
			}
		}

		const anAllPreset = (input) => {
			return {
				category: 'All',
				label: 'All',
				bank: {
					style: 'text',
					text: `All\\n${input}`,
					size: '18',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(32, 0, 0),
				},
				actions: [
					{
						action: 'sendToAllOutputs',
						options: {
							selected: false,
							input: input,
						},
					},
				],
			}
		}

		this.CHOICES_INPUTS.forEach((input) => {
			presets.push(aSelectPreset(input.id))
		})
		this.CHOICES_OUTPUTS.forEach((output) => {
			presets.push(aSwitchPreset(output.id))
		})
		this.CHOICES_INPUTS.forEach((input) => {
			presets.push(anAllPreset(input.id))
		})

		presets.push({
			category: 'In to Out',
			label: 'In to Out',
			bank: {
				style: 'text',
				text: 'In to Out',
				size: 'auto',
				color: this.rgb(255, 255, 255),
				bgcolor: this.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'sendInputToOutput',
					options: {
						input: '1',
						output: '1',
						select: false,
					},
				},
			],
		})

		presets.push({
			category: 'Buzzer',
			label: 'Buzzer On',
			bank: {
				style: 'text',
				text: 'Buzzer On',
				size: 'auto',
				color: this.rgb(255, 255, 255),
				bgcolor: this.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'buzzerON',
				},
			],
		})

		presets.push({
			category: 'Buzzer',
			label: 'Buzzer Off',
			bank: {
				style: 'text',
				text: 'Buzzer Off',
				size: 'auto',
				color: this.rgb(255, 255, 255),
				bgcolor: this.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'buzzerOFF',
				},
			],
		})

		presets.push({
			category: 'Mirror',
			label: 'Mirror',
			bank: {
				style: 'text',
				text: 'Mirror',
				size: 'auto',
				color: this.rgb(255, 255, 255),
				bgcolor: this.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'mirror',
				},
			],
		})
		this.setPresetDefinitions(presets)
	}
}
exports = module.exports = instance
