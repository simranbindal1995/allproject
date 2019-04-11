'use strict'

exports.toModel = (entity) => {
    const model = {
        id: entity.id,
        firstName: entity.firstName ? entity.firstName : entity.firstName,
        lastName: entity.lastName ? entity.lastName : entity.lastName,
        middleName: entity.middleName,
        email: entity.email,
        userRole: entity.userRole,
        profilePicId: entity.profilePic ? entity.profilePic : "",
        dob: entity.dob ? entity.dob : "",
        mobileNumber: entity.mobileNumber ? entity.mobileNumber : "",
        contryCode: entity.countryCode ? entity.countryCode : "",
        fullAddress: entity.fullAddress ? entity.fullAddress : "",
        accessToken: entity.token,
        otp: entity.otp,
        specialisationId: entity.specialisationId ? entity.specialisationId : "",
        gmcNumber: entity.gmcNumber ? entity.gmcNumber : "",
        yearsOfExp: entity.yearsOfExp ? entity.yearsOfExp : "",
        education: entity.education ? entity.education : "",
        identityProof: entity.identityProof ? entity.identityProof : "",
        signature: entity.signature ? entity.signature : "",
        documents: entity.documents ? entity.documents : [],
        profileStepCompleted: entity.profileStepCompleted ? entity.profileStepCompleted : "",
        isRejected: entity.isRejected || false,
        isApproved: entity.isApproved || false,
        totalUnReadNtfcnCount : entity.totalUnReadNtfcnCount || 0,
        totalUnReadMessageCount : entity.totalUnReadMessageCount || 0
    }

    return model
}