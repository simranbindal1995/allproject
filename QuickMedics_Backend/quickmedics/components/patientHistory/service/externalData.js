//exports.insertMedicinesInDb = insertMedicinesInDb

const insertDiagnosisInDb = async (params) => {

    logger.start("services:diagnosis:insertingDiagnosis")
    logger.start("For subscription-key credentails used : username: chezian76 @yahoo.co.uk : password: Admin123 on https://developer.api.nhs.uk")

    var arr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", 'U', "V", "W", "X", "Y", "Z"]

    for (const alpha in arr) {

        const url = "https://api.nhs.uk/conditions/?category=" + arr[alpha] + "&synonyms=true"
        await request.get({
            "headers": { "content-type": "application/json", "subscription-key": "09eaf06887bf4edf9f89e02ec88e8c7e" },
            "url": url
        }, (error, response, body) => {
            if (error) {
                throw new Error(error)
            } else {
                let res = JSON.parse(body)

                res.significantLink.forEach(async (item) => {
                    const name = item.name

                    const check = await db.diagnosis.findOne({ name: name })
                    if (check == null)
                        await db.diagnosis({ name: name }).save();
                })
            }
        })

    }
    return true;

}
const insertMedicinesInDb = async (params) => {

    logger.start("services:medicines:insertMedicinesInDb")
    logger.start("For subscription-key credentails used : username: chezian76 @yahoo.co.uk : password: Admin123 on https://developer.api.nhs.uk")

    var arr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", 'U', "V", "W", "X", "Y", "Z"]

    for (const alpha in arr) {
        const url = "https://api.nhs.uk/medicines/?category=" + arr[alpha]
        await request.get({
            "headers": { "content-type": "application/json", "subscription-key": "09eaf06887bf4edf9f89e02ec88e8c7e" },
            "url": url
        }, (error, response, body) => {
            if (error) {
                throw new Error(error)
            } else {
                let res = JSON.parse(body)
                if (res.significantLink) {
                    res.significantLink.forEach(async (item) => {
                        const name = item.name

                        const check = await db.medicines.findOne({ name: name })
                        if (check == null)
                            await db.medicines({ name: name, referenceObject: item }).save();
                    })
                }
            }
        })

    }
    return true;

}