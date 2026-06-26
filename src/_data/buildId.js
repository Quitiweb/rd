// Unique id per build, used to cache-bust CSS/JS so visitors always get
// the latest assets after a deploy (filenames stay stable otherwise).
module.exports = () => Date.now().toString(36);
