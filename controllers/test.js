async function test (ctx, next) {
	
	await next();
}

module.exports = {test}