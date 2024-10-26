import axios from "axios";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import morgan from "morgan";
import Debug from "debug";
import CustomError from "./utils/CustomError.js";
import globalErrorHandlingMiddlewareController from "./controllers/errorController.js";
import { sendErrorFile } from "./utils/errorFile.js";
import {
  tryCatchAsyncController,
  checkIsNotUndefined,
} from "./utils/tryCatch-checkUndefined.js";
// command to run this file: $env:DEBUG="apigateway-info-logs,apigateway-error-logs,errorController-info-logs,errorController-error-logs,errorFile-info-logs,errorFile-error-logs, tryCatch-error-logs,tryCatch-info-logs"; node .\apigateway.js
let apigateway;
const debugInfo = Debug("apigateway-info-logs");
const debugError = Debug("apigateway-error-logs");
debugInfo("Info log: start variables defined, in apigateway.");
const app = express();
const port = 3000;
const _dirname = dirname(fileURLToPath(import.meta.url));
const API_URL = "http://localhost:4000";
//const API_URL = `https://eight-6-permalist-project-render-server.onrender.com`;
debugInfo("Info log: end variables defined, in apigateway.");

debugInfo("Info log: middleware start, in apigateway.");
app.use(express.static(_dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("combined"));
debugInfo("Info log: middleware end, in apigateway.");

/*calls API to get list of to do list items
@params error: if error is undefined that means error contains a string that says that an error occurred during adding, updating or deleting an item. It means we can still use this createToDoList method to retrieve all the values in the database and create a list for the user. we will pass along this error to the ui as well, so the user knows that the last opreation failed.
*/
async function createToDoList(req, res, error) {
  debugInfo("Info log: createToDoList start, in apigateway.");
  const response = await axios.get(`${API_URL}/api/v1/items`);
  debugInfo(
    "Info log: axios request completed, createToDoList, in apigateway."
  );
  if (response.data.error == undefined) {
    debugInfo(
      "Info log: Check if there was an error when retrieving all items via axios and if not, show the user the regular page, but if there was an error, then show the user the error page, createToDoList, in apigateway."
    );
    const objToReturn = {
      listTitle: response.data.listTitle,
      listItems: response.data.listItems,
    };
    debugInfo("Info log: objToReturn created, createToDoList, in apigateway.");
    if (error != undefined) {
      debugInfo(
        "Info log: There was an error while doing a create, update or delete operation, prior to the axios get in this function. This error is passed along to the ui, createToDoList, in apigateway."
      );
      objToReturn.error = error;
      debugInfo(
        "Info log: error added to objToReturn, createToDoList, in apigateway."
      );
    }
    res.render(_dirname + "/views/index.ejs", objToReturn);
  } else {
    debugInfo(
      "Info log: There was an error in retrieving all that data via axios, createToDoList, in apigateway."
    );
    res.render(_dirname + "/views/error.ejs", { error: response.data.error });
  }
  debugInfo("Info log: createToDoList end, in apigateway.");
}

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

//throw new Error("testing uncaught exception");
// const p = new Promise((_, reject) => {
//   reject(new Error("This is a test unhandled rejection!"));
// });

/*Base URL endpoint handled.*/
app.get(
  "/",
  tryCatchAsyncController(async (req, res, next) => {
    debugInfo("Info log: app.get / func start, in apigateway.");
    await createToDoList(req, res, undefined);
    debugInfo("Info log: app.get / func end, in apigateway.");
  })
);

/*Adding an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
app.post(
  "/addItem",
  tryCatchAsyncController(async (req, res, next) => {
    debugInfo("Info log: app.post /add func start, in apigateway.");
    req.messageInEventOfErrorDuringExecutionOfAxios = `Error log: failed happened at: axios(${API_URL}/api/v1/items/add)`;
    let messageIfDataIsUndefined = `All the data needed to add the item was not entered, so the item could not be added.`;
    const isNotUndefined = checkIsNotUndefined(
      [req.body.newItem],
      messageIfDataIsUndefined,
      next
    );
    if (isNotUndefined) {
      const response = await axios.post(
        `${API_URL}/api/v1/items/add`,
        req.body
      );
      await createToDoList(req, res, response.data.error);
    }
    debugInfo("Info log: app.post /add func end, in apigateway.");
  })
);

/*Updating an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
app.post(
  "/editItem",
  tryCatchAsyncController(async (req, res, next) => {
    debugInfo("Info log: app.post /edit func start, in apigateway.");
    req.messageInEventOfErrorDuringExecution = `Error log: failed happened at: axios(${API_URL}/api/v1/items/edit)`;
    let messageIfDataIsUndefined = `All the data needed to edit the item was not entered, so the item could not be edited.`;
    const isNotUndefined = checkIsNotUndefined(
      [req.body.updatedItemId, req.body.updatedItemTitle],
      messageIfDataIsUndefined,
      next
    );
    if (isNotUndefined) {
      const response = await axios.patch(
        `${API_URL}/api/v1/items/edit`,
        req.body
      );
      await createToDoList(req, res, response.data.error);
    }
    debugInfo("Info log: app.post /edit func end, in apigateway.");
  })
);

/*Deleting an item on a to do list. First it is determined whether any of the necessary form data is undefined and if it is all defined then the api call to make the update is made in the try block.*/
app.post(
  "/deleteItem",
  tryCatchAsyncController(async (req, res, next) => {
    debugInfo("Info log: app.post /delete func start, in apigateway.");
    req.messageInEventOfErrorDuringExecution = `Error log: failed happened at: axios(${API_URL}/api/v1/items/delete)`;
    let messageIfDataIsUndefined = `All the data needed to delete the item was not entered, so the item could not be deleted.`;
    const isNotUndefined = checkIsNotUndefined(
      [req.body.deleteItemId],
      messageIfDataIsUndefined,
      next
    );
    if (isNotUndefined) {
      const response = await axios.delete(`${API_URL}/api/v1/items/delete`, {
        data: { deleteItemId: req.body.deleteItemId },
      });
      await createToDoList(req, res, response.data.error);
    }
    debugInfo("Info log: app.post /delete func end, in apigateway.");
  })
);

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
