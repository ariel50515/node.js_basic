const bcrypt = require("bcryptjs");
(async () => {
    const h = await bcrypt.hash("123456",10);
    console.log(h);
    const hashStr = "$2a$10$u1sCkQnwvxaINNwrI4rmwemlem/ygPcA3atPiQBtOEGa0DAjij7Hu"
    console.log(await bcrypt.compare("123456", hashStr));
})();