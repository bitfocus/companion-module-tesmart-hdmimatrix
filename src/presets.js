const { combineRgb } = require('@companion-module/base')

module.exports = {
	initPresets: function () {
		let self = this;
		let presets = []

		const foregroundColor = combineRgb(255, 255, 255) // White
		const foregroundColorBlack = combineRgb(0, 0, 0) // Black
		const backgroundColorRed = combineRgb(255, 0, 0) // Red
		const backgroundColorGreen = combineRgb(0, 255, 0) // Green
		const backgroundColorOrange = combineRgb(255, 102, 0) // Orange

		const aSelectPreset = (input) => {
			return {
				type: 'button',
				category: 'Select Input',
				name: 'Select',
				style: {
					text: `In ${input}\\n> $(${this.config.label}:input_route${input})`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'select_input',
								options: {
									input: input,
								},
							},
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'selected',
						options: {
							input: input,
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(255, 0, 0),
						},
					},
				],
			}
		}
		const aSwitchPreset = (output) => {
			return {
				type: 'button',
				category: 'Switch Output',
				name: 'Switch',
				style: {
					text: `Out ${output}\\n< $(${this.config.label}:output_route${output})`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'switch_output',
								options: {
									output: output,
								},
							},
						],
						up: []
					}
				],
				feedbacks: [
					{
						feedbackId: 'output',
						options: {
							output: output,
						},
						style: {
							color: combineRgb(0, 0, 0),
							bgcolor: combineRgb(0, 255, 0),
						},
					},
				],
			}
		}
	
		const anAllPreset = (input) => {
			return {
				type: 'button',
				category: 'All',
				name: 'All',
				style: {
					text: `All\\n${input}`,
					size: '18',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(32, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'sendToAllOutputs',
								options: {
									selected: false,
									input: input,
								},
							},
						],
						up: []
					}
				],
				feedbacks: [],
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
			type: 'button',
			category: 'In to Out',
			name: 'In to Out',
			style: {
				text: 'In to Out',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'sendInputToOutput',
							options: {
								input: '1',
								output: '1',
								select: false,
							},
						},
					],
					up: []
				}
			],
			feedbacks: [],
		})
	
		presets.push({
			type: 'button',
			category: 'Buzzer',
			name: 'Buzzer On',
			style: {
				text: 'Buzzer On',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'buzzerON',
							options: {}
						},
					],
					up: []
				}
			],
			feedbacks: [],
		})
	
		presets.push({
			type: 'button',
			category: 'Buzzer',
			name: 'Buzzer Off',
			style: {
				text: 'Buzzer Off',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'buzzerOFF',
							options: {}
						},
					],
					up: []
				}
			],
			feedbacks: [],
		})
	
		presets.push({
			type: 'button',
			category: 'Mirror',
			name: 'Mirror',
			style: {
				text: 'Mirror',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'mirror',
							options: {}
						},
					],
					up: []
				}
			],
			feedbacks: [],
		})

		self.setPresetDefinitions(presets);
	}
}	