const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    description: {
        required: true,
        type: String,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, //get the user id that's currently loggin in
        required: true,
        ref: "User" //reference to the user model
    }
}, {
    timestamps: true //generate timestamps
});
//Tasks
const Tasks = mongoose.model("Tasks", taskSchema);

module.exports = Tasks;