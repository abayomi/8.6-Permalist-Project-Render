import Debug from "debug";

const debugInfo = Debug("errorFile-info-logs");
const debugError = Debug("errorFile-error-logs");

/*All errors send the same user friendly error page.*/
function sendErrorFile(res, errorMessage) {
  debugInfo("Info log: sendErrorFile func start, in apigateway.");
  //if response is not sent then send the erro page. Nothing should have been sent already, but just in case a logicl programming bug was introduced and a response was sent, this check is added.
  if (!res.headersSent) res.render("error.ejs", { error: errorMessage });
  debugInfo("Info log: sendErrorFile func end, in apigateway.");
}
export { sendErrorFile };
