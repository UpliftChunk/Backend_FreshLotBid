module.exports = (theFunctin) => (req, res, next) => {
   Promise.resolve(theFunctin(req, res, next)).catch(next);
}