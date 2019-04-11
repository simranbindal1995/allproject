/* Sevices */


const addDegree = async (params) => {
    logger.start(`users:services:addDegree`)

    const check = await db.degrees.findOne({ name: params.name })
    if (check != null) throw new Error("Already Exists !")

    await db.degrees(params).save();

    return "Saved successfully"
}

const fetchDegrees = async (params) => {

    const data = await db.degrees.find({ isDeleted: false }, { name: 1 }, { sort: { name: 1 } })
    return data
}

exports.addDegree = addDegree
exports.fetchDegrees = fetchDegrees