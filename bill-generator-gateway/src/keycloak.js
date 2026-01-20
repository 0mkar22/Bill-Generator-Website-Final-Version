import Keycloak from "keycloak-js";

// Load IP from .env
const ip = import.meta.env.VITE_PUBLIC_IP || "localhost";

const keycloak = new Keycloak({
  url: `http://bill-generator.${ip}.nip.io`, 
  realm: "BillGeneratorRealm",
  clientId: "bill-generator-frontend",
});

export default keycloak;