import { dataTreeEvaluator } from "./evalTree";
import { removeFunctions } from "../evaluationUtils";
import { EvalWorkerSyncRequest } from "../types";

export default function(request: EvalWorkerSyncRequest) {
  const { requestData } = request;
  const { bindings, executionParams } = requestData;
  if (!dataTreeEvaluator) {
    return { values: undefined, errors: [] };
  }

  const values = dataTreeEvaluator.evaluateActionBindings(
    bindings,
    executionParams,
  );

  const cleanValues = removeFunctions(values);

  const errors = dataTreeEvaluator.errors;
  dataTreeEvaluator.clearErrors();
  return { values: cleanValues, errors };
}
