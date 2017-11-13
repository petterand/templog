var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var tempSchema = new Schema({
    measured_at: {type: Date, required: true},
    temperature: {type: String, required: true}
});

tempSchema.pre('validate', function(next) {
    var currentDate = new Date();

    this.measured_at = currentDate;

    next();
});

var Temp = mongoose.model('Temp', tempSchema);

module.exports = Temp;