

module.exports = (myFun) => {
    return (req, res, next) => {
        myFun(req, res, next).catch(next);
    }
}
