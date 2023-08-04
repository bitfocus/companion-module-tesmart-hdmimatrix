module.exports = {
	initActions: function () {
		let self = this;
		let actions = {};

		actions.select_input = {
			name: 'Select Input',
			options: [
				{
					type: 'dropdown',
					label: 'Input Port',
					id: 'input',
					default: '1',
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: function (action) {
				self.selectedInput = action.options.input;
				self.checkFeedbacks();
			}
		};
		
		actions.switch_output = {
			name: 'Switch Output',
			options: [
				{
					type: 'dropdown',
					label: 'Output Port',
					id: 'output',
					default: '1',
					choices: self.CHOICES_OUTPUTS,
				},
			],
			callback: function (action) {
				self.sendCommmand(
					'MT00SW' + self.selectedInput.toString().padStart(2, '0') + action.options.output.toString().padStart(2, '0') + 'NT'
				)
				self.updateRoute(action.options.output, self.selectedInput)
				self.checkFeedbacks();
			}
		};
		
		actions.sendInputToOutput = {
			name: 'Input to Output',
			options: [
				{
					type: 'dropdown',
					label: 'Output Port',
					id: 'output',
					default: '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Input Port',
					id: 'input',
					default: '1',
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: function (action) {
				self.sendCommmand(
					'MT00SW' + action.options.input.toString().padStart(2, '0') + action.options.output.toString().padStart(2, '0') + 'NT'
				)
				self.updateRoute(action.options.output, action.options.input)
				self.checkFeedbacks();
			}
		};
		
		actions.sendToAllOutputs = {
			name: 'All outputs to selected input',
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
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: function (action) {
				let myInput = self.selectedInput
					if (!action.options.selected) {
						myInput = action.options.input
					}
					self.sendCommmand('MT00SW' + myInput.toString().padStart(2, '0') + '00NT')
					self.checkFeedbacks();
			}
		};
		
		actions.mirror = {
			name: 'Mirror each output to input',
			options: [],
			callback: function (action) {
				self.sendCommmand('MT00SW0000NT')
				self.checkFeedbacks();
			}
		};
		
		actions.loadPreset = {
			name: 'Recall routes from preset number',
			options: [
				{
					type: 'dropdown',
					label: 'Preset number',
					id: 'preset',
					default: '1',
					choices: self.CHOICES_PRESETS,
				},
			],
			callback: function (action) {
				self.sendCommmand('MT00RD01' + action.options.preset.toString().padStart(2, '0') + 'NT')
				self.checkFeedbacks();
			}
		};
		
		actions.savePreset = {
			name: 'Save current routes to preset number',
			options: [
				{
					type: 'dropdown',
					label: 'Preset number',
					id: 'preset',
					default: '1',
					choices: self.CHOICES_PRESETS,
				},
			],
			callback: function (action) {
				self.sendCommmand('MT00SV00' + action.options.preset.toString().padStart(2, '0') + 'NT')
				self.checkFeedbacks();
			}
		};
		
		actions.buzzerON = {
			name: 'Buzzer On',
			options: [],
			callback: function (action) {
				self.sendCommmand('MT00BZEN00NT')
			}
		};
		
		actions.buzzerOFF = {
			name: 'Buzzer Off',
			options: [],
			callback: function (action) {
				self.sendCommmand('MT00BZEN01NT')
			}
		};

		self.setActionDefinitions(actions);
	}
}