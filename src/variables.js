module.exports = {
	initVariables: function () {
		let self = this;
		let variables = []

		self.CHOICES_INPUTS.forEach((item) => {
			variables.push({
				name: `Input ${item.id}`,
				variableId: `input_route${item.id}`,
			})
		})

		self.CHOICES_OUTPUTS.forEach((item) => {
			variables.push({
				name: `Output ${item.id}`,
				variableId: `output_route${item.id}`,
			})
		})	

		self.setVariableDefinitions(variables);

		let variableObj = {};
		self.CHOICES_OUTPUTS.forEach((output) => {
			variableObj[`output_route${output.id}`] = this.outputRoute[output.id];
		})
		self.setVariableValues(variableObj);
		self.updateMatrixVariables()
	},

	checkVariables: function () {
		let self = this;

		try {
			let variableObj = {};			

			self.setVariableValues(variableObj);
		}
		catch(error) {
			self.log('error', 'Error parsing Variables: ' + String(error))
		}
	}
}