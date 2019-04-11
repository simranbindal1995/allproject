'use strict'
const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')

const uploadFile = async (params) => {
    const log = logger.start(`files:services:uploadImagetoTemp`)

    params.ext = await checkExtension(params)

    params.path = '/tmp/quickMedics-';
    await createTempFolder(params.path)

    const obj = {
        userId: params.payload.userId,
        tmpLocation: params.path,
        fileOriginalName: params.payload.file.hapi.filename,
        fileType: params.payload.file.hapi.headers["content-type"],
        fileExtension: params.ext,
        type: params.payload.type,
        uploadedAt: moment().unix()
    }

    params.fileDetails = await db.files(obj).save()

    await writeFile(params)

    log.end()
    return params.fileDetails
}

const checkExtension = async (params) => {
    logger.start("files:checkExtension")
    const ext = params.payload.file.hapi.filename.substr(params.payload.file.hapi.filename.lastIndexOf('.') + 1);

    logger.start(`file extension found ${ext}`)

    if (params.payload.type == 1 || params.type == 8) { //ProfilePic or chat image
        if (ext != 'jpg' && ext != 'jpeg' && ext != 'png') throw new Error("Only images with format jpg , jpeg , png allowed")
    }

    await checkSize(params)

    return ext;
}

const checkSize = async (params) => {
    logger.start("Uploadfile:checkSize")
    logger.start("uploadFile::currently allowing 3mb")
    if (params.payload.file['_data'].length > 1048576 * 3) throw new Error("Maximum file size allowed 3 MB")

    return true;
}

const createTempFolder = async (params) => {

    const mode = "0777";
    try {
        logger.start("uploading image in temp foldet")
        const x = await fs.mkdir(params, mode)
        return true;
    } catch (err) {
        if (err.code != 'EEXIST') {
            logger.error(err)
        }
        return true;
    }
}

const writeFile = async (params) => {

    const writePath = params.path + '/' + params.fileDetails._id + '.' + params.ext;
    const fileStream = fs.createWriteStream(writePath);
    params.payload.file.pipe(fileStream)
    fileStream.on('finish', function() {
        return true;
    });

}

const moveFileFromTempToCdn = async (params) => {
    logger.start("files:services:creating folder on server")
    const fileInfo = await db.files.findOne({ _id: params.imageId, tmpFile: true })
    const oldPath = fileInfo.tmpLocation + "/" + fileInfo._id + "." + fileInfo.fileExtension;
    const newPath = path.join(__dirname, "../../../assets/images/cdn/" + fileInfo.userId + "/" + fileInfo._id + "." + fileInfo.fileExtension);
    const folderPath = path.join(__dirname, "../../../assets/images/cdn/" + fileInfo.userId);

    await createTempFolder(folderPath)
    const record = await moveFileToServer(fileInfo, oldPath, newPath)
    return record;
}

const moveFileToServer = async (fileInfo, oldPath, newPath) => {
    logger.start("files:services:moving file on server from temp")
    try {
        fs.rename(oldPath, newPath)
        const record = await updateFileRecord(fileInfo)
        return record;
    } catch (err) {
        if (err.code == 'EXDEV') {
            var execStatement = 'mv ' + oldPath + '  ' + newPath;
            await exec(execStatement)
            const record = await updateFileRecord(fileInfo)
            return record;
        }
    }

}

const updateFileRecord = async (fileInfo) => {
    logger.start("files:services:updating file in db")
    const record = await db.files.findOneAndUpdate({ _id: fileInfo._id }, { tmpFile: false }, { new: true })
    return record;
}

const fetchFile = async (params) => {

    const file = await db.files.findOne({ _id: params.fileId, isDeleted: false, tmpFile: false })
    if (file == null) return new Error('File not found')
    return file;
}
const deleteFile = async (params) => {
    logger.start("files:services:deleteFile")
    let objToSave = {}

    const fileUpdate = await db.files.findOneAndUpdate({ _id: params.fileId, type: params.type, userId: params.userId }, { isDeleted: true }, { new: true })
    if (fileUpdate == null) {
        throw new Error("Either type is invalid or you are not authorised")
    }
    params.type == 2 ? objToSave.$pull = { correspondence: params.fileId } : null
    params.type == 3 ? objToSave.$pull = { "family.$.relationProofId": params.fileId } : null
    params.type == 4 ? objToSave.$pull = { "family.$.correspondenceId": params.fileId } : null
    params.type == 5 ? objToSave.$unset = { identityProof: params.fileId } : null
    params.type == 6 ? objToSave.$unset = { signature: params.fileId } : null
    params.type == 7 ? objToSave.$pull = { documents: params.fileId } : null
    console.log(params.userId, objToSave)
    const user = await db.users.findOneAndUpdate({ _id: params.userId }, objToSave)
    return "File deleted successfully"
}

exports.uploadFile = uploadFile
exports.checkExtension = checkExtension
exports.checkSize = checkSize
exports.createTempFolder = createTempFolder
exports.writeFile = writeFile
exports.moveFileFromTempToCdn = moveFileFromTempToCdn
exports.moveFileToServer = moveFileToServer
exports.updateFileRecord = updateFileRecord
exports.fetchFile = fetchFile
exports.deleteFile = deleteFile