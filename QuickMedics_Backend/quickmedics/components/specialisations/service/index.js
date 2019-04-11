/* Sevices */

const _ = require('underscore')

const enterSpecialisation = async (params) => {
    logger.start(`users:services:enterSpecialisation`)

    const check = await db.specialisations.findOne({ name: params.name })
    if (check != null) throw new Error("Already Exists !")

    if (params.parentId == "") delete params.parentId
    await db.specialisations(params).save();

    return "Saved successfully"
}

const fetchSpecialisations = async (params) => {
    logger.start(`users:services:fetchSpecialisations`)

    const check = await db.specialisations.find({ isChild: true }, {}, { sort: { name: 1 } })
        .populate({ path: "parentId", select: "name" })

    const group = _.groupBy(check, (item) => {
        return item.parentId
    })
    const map = _.map(group)
    let arr = []
    for (var i = 0; i < map.length; i++) {
        let tmp = []
        for (var j = 0; j < map[i].length; j++) {
            tmp.push({ _id: map[i][j]._id, name: map[i][j].name })
        }
        arr.push({ parent: map[i][0].parentId.name, childs: tmp })
    }

    return arr;
}

exports.enterSpecialisation = enterSpecialisation
exports.fetchSpecialisations = fetchSpecialisations