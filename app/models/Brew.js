var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var brewSchema = new Schema({
    started_at: {type: Date},
    ended_at: {type: Date},
    name: {type: String, required: true}
});

var Brew = mongoose.model('Brew', brewSchema);

module.exports = Brew;