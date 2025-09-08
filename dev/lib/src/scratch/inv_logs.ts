import LogInvestigator from "../debug/internal_logging/parse/logInverstigator";


const inv = await LogInvestigator.fromFile("./src/debug/logging/logs/logs.log");

//const e = inv.messages().filter(log => log.content.data?.mpo_message_protocol_name === "get_exposed");
//e.print();
inv.print();