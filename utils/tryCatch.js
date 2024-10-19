import Debug from "debug";

const debugInfo = Debug("tryCatch-info-logs");
const debugError = Debug("tryCatch-error-logs");

/*take a function as an input, call it controller and return an aync function that wraps the input function in a try catch block. */
function tryCatch(controller) {
  return async (req, res, next) => {
    debugInfo("Info log: Start of tryCatch(controller).");
    try {
      //   const err = new Error("fake");
      //   throw err;
      await controller(req, res, next);
    } catch (error) {
      console.log("in error trycatch");
      debugError(req.messageInEventOfErrorDuringExecution);
      next(error); //will call global error handling middleware
      //sendErrorFile(res);
    } finally {
      debugInfo("Info log: End of tryCatch(controller).");
    }
  };
}
/*Alternative way of writing function.*/
// const tryCatch = (controller) => async (req, res, next) => {
//   debugInfo("Info log: Start of tryCatch(controller).");
//   try {
//     await controller(req, res, next);
//   } catch (error) {
//     debugError(
//       `Error log: failed happened at: axios/items, called by tryCatch from apigateway.)`
//     );
//     return next(error); //will call global error handling middleware
//     //sendErrorFile(res);
//   }
// };

export { tryCatch };
