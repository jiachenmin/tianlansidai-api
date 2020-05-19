
const doctorModel = require('../../models/doctor')

async function getDoctor(ctx, next) {

    let user = ctx.state.user
    if (!user || !user.phone) {
        await next()
    }
    let doctor = await doctorModel.getOneByQuery({ phone: user.phone })
    ctx.state.doctor = doctor
    await next()
}

module.exports = { getDoctor }