'use strict'



const addStaticPageData = async (params) => {
    const log = logger.start('staticPages:service:fetchStaticPages')

    const data = await db.staticPages.findOneAndUpdate({ contentType: params.contentType }, { updatedAt: moment().unix(), content: params.content }, { lean: true, new: true, upsert: true })

    return "Data added successfully"
}
const fetchStaticPages = async (params) => {
    const log = logger.start('staticPages:service:fetchStaticPages')

    const data = await db.staticPages.findOne({ contentType: params.contentType })

    return data || {}
}

const addFaq = async (params) => {

    if (params.questionId && params.questionId != "") {

        await db.staticPages.findOneAndUpdate({
            contentType: 2,
            questionsAnswers: { $elemMatch: { _id: params.questionId } }
        }, { $set: { 'questionsAnswers.$.question': params.question, 'questionsAnswers.$.answer': params.answer } })

    } else {
        const check = await db.staticPages.findOne({ contentType: 2 })

        if (check) { //push
            await db.staticPages.findOneAndUpdate({ contentType: 2 }, {
                updatedAt: moment().unix(),
                $push: { questionsAnswers: { question: params.question, answer: params.answer } }
            })
        } else {
            await db.staticPages({
                contentType: 2,
                updatedAt: moment().unix(),
                questionsAnswers: [{
                    question: params.question,
                    answer: params.answer
                }]
            }).save()
        }


    }

    return "FAQ added successfully"

}



exports.addStaticPageData = addStaticPageData
exports.fetchStaticPages = fetchStaticPages
exports.addFaq = addFaq