import express from "express";
import Debug from "debug";
const debugInfo = Debug("apigateway-info-logs");
const debugError = Debug("apigateway-error-logs");
import {
  tryCatchAsyncController,
  checkIsNotUndefined,
} from "../utils/tryCatch-checkUndefined.js";

import {
  apigatewayGetAllController,
  apigatewayAddController,
  apigatewayEditController,
  apigatewayDeleteController,
} from "../controllers/apigatewayController.js";

/*Creating the default winston logger format is json. format: winston.format.cli() gives color coding */
debugInfo("Start of variable definition.");
const apigatewayRouter = express.Router();
debugInfo("End of variable definition.");

/*Getting all items on a to do list.*/
apigatewayRouter.get("/", tryCatchAsyncController(apigatewayGetAllController));

/*Adding an item to the to do list.*/
apigatewayRouter.post(
  "/addItem",
  tryCatchAsyncController(apigatewayAddController)
);

/*Updating an item on a to do list.*/
apigatewayRouter.post(
  "/editItem",
  tryCatchAsyncController(apigatewayEditController)
);

/*Deleting an item on a to do list.*/
apigatewayRouter.post(
  "/deleteItem",
  tryCatchAsyncController(apigatewayDeleteController)
);

export { apigatewayRouter };
