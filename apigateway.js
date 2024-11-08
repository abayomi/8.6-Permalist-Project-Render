import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import morgan from "morgan";
import Debug from "debug";
import CustomError from "./utils/CustomError.js";
import globalErrorHandlingMiddlewareController from "./controllers/errorController.js";

import { apigatewayRouter } from "./routes/apigatewayRoutes.js";
// command to run this file: $env:DEBUG="apigateway-info-logs,apigateway-error-logs,errorController-info-logs,errorController-error-logs,errorFile-info-logs,errorFile-error-logs, tryCatch-error-logs,tryCatch-info-logs"; node .\apigateway.js
let apigateway;
const debugInfo = Debug("apigateway-info-logs");
const debugError = Debug("apigateway-error-logs");
debugInfo("Info log: start variables defined, in apigateway.");
const app = express();
const port = 3000;
const _dirname = dirname(fileURLToPath(import.meta.url));
//const API_URL = `https://eight-6-permalist-project-render-server.onrender.com`;
debugInfo("Info log: end variables defined, in apigateway.");

debugInfo("Info log: middleware start, in apigateway.");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("combined"));
// Although the ejs files are rendering fine without the lines below. I am still writing these lines in case there is an issue later on.
// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(_dirname, "views"));
// Serve static files (like stylesheets)
//Although I don't need the path.join and I can concat the dirname and public, I observed that morgan did not log the resquests for the files in the public folder, even though I can still see the requests for the files in chrome devtools.
app.use(express.static(path.join(_dirname, "public")));
console.log(path.join(_dirname, "public"));
debugInfo("Info log: middleware end, in apigateway.");

app.use("/", apigatewayRouter);

app.get("/favicon.ico", (req, res) => {
  debugInfo("favicon request.");
  //res.status(204).end(); // 204 No Content
  res.sendFile(path.join(_dirname, "public", "assets", "logo.jpg"));
});

/*Catches exceptions that were not handled in the code. So this is the last place for the node process to catch the error and gracefully handle it.
This is near the top of the js file as we want it to be run before the code below it is run, so that it can catch any uncaught exceptiosn that happend below it. If this code is at the bottom of this js file, it will be run after the rest of code in this file, so if the code above it throws an uncaght exception then this code wont catch the uncaught exception as it is run after the uncaught exception.
So any exception to caught by express will be handled here.  
*/
await process.on("uncaughtException", async (error) => {
  debugError(
    "Error log: uncaughtException: " +
      error.name +
      ": " +
      error.message +
      " : " +
      error.stack
  );
  //to do: send out email and restart processes automatically https://www.youtube.com/watch?v=vAH4GRWbAQw
  //to do: do some checks to determine status of services and database
  debugInfo("uncaughtException.");
  if (apigateway != undefined) {
    await apigateway.close(async () => {
      debugInfo(
        "uncaughtException. Express server closed. Node process now closing."
      );
      debugInfo("uncaughtException. Exiting process.");
      process.exit(1);
    }); // give server time to close first and then the callback to exit the node process is called. since the process has exited, if a user makes a request to the system, he will not get a response.
  }
});

/*Handling all endpoint requests that are invalid.*/
app.all("*", async (req, res, next) => {
  debugInfo("Info log: app.all * func start, in apigateway.");
  // Option1
  //I considered creating an error object and passing it to the global error handling middleware. But for now decided against that. The code is still here as I want to think about it.
  //Simple error message in he brackets below, might need to be altered.
  const err = new Error(
    `Custom error: Can't find ${req.originalUrl} on the api gateway.`
  );
  err.status = "fail";
  err.statusCode = 404;
  //In the line below, passing any parameter to the next function, Express will know an error has happened and Express will bypass all other middleware functions which are present in the middleware stack and will directly call the global error handling middleware below.
  //next(err); //commented out until i decide to use this error to trigger the global error handling middleware. will replace senErrorFIle
  // Option 2
  //Considering having a custom error class. Commented out until I decide.
  const erro = new CustomError(
    `Can't find  ${req.originalUrl} on the api gateway!`,
    404
  );
  next(err); //commented out until i decide to use this custom error to trigger the global error handling middleware. will replace senErrorFIle
  //Option 3
  //sendErrorFile(res);
  debugInfo("Info log: app.all * func end, in apigateway.");
});

/*Global error handling middleware.*/
app.use(globalErrorHandlingMiddlewareController);

/*If the nodejs process is terminated maully, this code will execute and can be used to do any action that need to be done b4 the node process ends, so that it gracefully shuts down the node process.*/
await process.on("SIGINT", async () => {
  debugInfo("Info log: SIGINT: ");
  //to do: send out email and restart processes automatically https://www.youtube.com/watch?v=vAH4GRWbAQw
  //to do: do some checks to determine status of services and database
  debugInfo("SIGINT.");
  if (apigateway != undefined) {
    await apigateway.close(async () => {
      debugInfo("SIGINT. Express server closed. Node process now closing.");
      debugInfo("SIGINT. Exiting process.");
      process.exit(0);
    }); // give server time to close first and then the callback to exit the node process is called. since the process has exited, if a user makes a request to the system, he will not get a response.
  }
});

/*This is called if an async function has an unhandled promise rejection. If this was not here, then the rejected promise would eventually be caught by the uncaughtException process.on.*/
await process.on("unhandledRejection", async (error) => {
  debugError(
    "Error log: unhandledRejection: " +
      error.name +
      ": " +
      error.message +
      " : " +
      error.stack
  );
  //to do: send out email and restart processes automatically https://www.youtube.com/watch?v=vAH4GRWbAQw
  //to do: do some checks to determine status of services and database
  debugInfo("unhandledRejection.");
  if (apigateway != undefined) {
    await apigateway.close(async () => {
      debugInfo(
        "unhandledRejection. Express server closed. Node process now closing."
      );
      debugInfo("unhandledRejection. Exiting process.");
      process.exit(1);
    }); // give server time to close first and then the callback to exit the node process is called. since the process has exited, if a user makes a request to the system, he will not get a response.
  }
});

/*Listening on port.*/
debugInfo("Info log: app.listen start, in apigateway");
apigateway = app.listen(port, () => {
  debugInfo(`API Gateway listening on port ${port}, in apigateway`);
});
debugInfo("Info log: app.listen end, in apigateway");
