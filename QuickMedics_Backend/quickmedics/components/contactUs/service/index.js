/* Sevices */


const contactUs = async (params) => {

    params.createdAt = moment().unix()
    const check = await db.contactUs(params).save();

    return "Sent successfully"
}

const fetchContactUs = async (params) => {

    const data = await db.contactUs.find({}, {}, { sort: { createdAt: -1 }, skip: params.skip || 0, limit: params.limit || 10 })
    data.totalCount = await db.contactUs.count({})

    return data
}

const feedback = async(params) => {

	params.createdAt = moment().unix()
    const check = await db.feedbacks(params).save();

    return "Sent successfully"


}


exports.contactUs = contactUs
exports.fetchContactUs = fetchContactUs
exports.feedback = feedback