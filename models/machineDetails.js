const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const machineDetailsSchema = new Schema({
    machine_no: { type: String, required: true, unique: true },
    machine_name: { type: String },
    location: { type: String },
    image: { type: String },
    specifications: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ]
}, {
    timestamps: true
});

const MachineDetails = mongoose.model("machinedetails", machineDetailsSchema);
module.exports = MachineDetails;
