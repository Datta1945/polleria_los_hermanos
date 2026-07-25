import sequelize from "./config/database.js";
import { User, Role } from "./models/index.js";

const check = async () => {
  await sequelize.authenticate();
  const users = await User.findAll({
    include: [{ model: Role, attributes: ["id", "nombre"] }],
    attributes: { exclude: ["password"] },
  });
  for (const u of users) {
    console.log(`  ${u.nombre} | Rol: ${u.Role?.nombre || "SIN ROL"} | email: ${u.email || "N/A"}`);
  }
  await sequelize.close();
};

check();
