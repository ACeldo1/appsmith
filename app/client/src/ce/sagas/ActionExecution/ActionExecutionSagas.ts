import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  EventType,
  ExecuteTriggerPayload,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";
import * as log from "loglevel";
import { all, call, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  evaluateAndExecuteDynamicTrigger,
  evaluateArgumentSaga,
  evaluateSnippetSaga,
  setAppVersionOnWorkerSaga,
} from "sagas/EvaluationsSaga";
import navigateActionSaga from "sagas/ActionExecution/NavigateActionSaga";
import storeValueLocally, {
  clearLocalStore,
  removeLocalValue,
} from "sagas/ActionExecution/StoreActionSaga";
import downloadSaga from "sagas/ActionExecution/DownloadActionSaga";
import copySaga from "sagas/ActionExecution/CopyActionSaga";
import resetWidgetActionSaga from "sagas/ActionExecution/ResetWidgetActionSaga";
import showAlertSaga from "sagas/ActionExecution/ShowAlertActionSaga";
import executePluginActionTriggerSaga from "sagas/ActionExecution/PluginActionSaga";
import { clearActionResponse } from "actions/pluginActionActions";
import {
  closeModalSaga,
  openModalSaga,
} from "sagas/ActionExecution/ModalSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  logActionExecutionError,
  TriggerFailureError,
  UncaughtPromiseError,
  UserCancelledActionExecutionError,
} from "sagas/ActionExecution/errorUtils";
import {
  clearIntervalSaga,
  setIntervalSaga,
} from "sagas/ActionExecution/SetIntervalSaga";
import {
  getCurrentLocationSaga,
  stopWatchCurrentLocation,
  watchCurrentLocation,
} from "sagas/ActionExecution/GetCurrentLocationSaga";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { postMessageSaga } from "sagas/ActionExecution/PostMessageSaga";
import {
  ActionDescription,
  ActionTriggerType,
  ClearIntervalDescription,
  ClearPluginActionDescription,
  CloseModalActionDescription,
  ConfirmationModalDescription,
  CopyToClipboardDescription,
  DownloadActionDescription,
  GetCurrentLocationDescription,
  NavigateActionDescription,
  PostMessageDescription,
  RemoveValueActionDescription,
  ResetWidgetDescription,
  RunPluginActionDescription,
  SetIntervalDescription,
  ShowAlertActionDescription,
  ShowModalActionDescription,
  StoreValueActionDescription,
  WatchCurrentLocationDescription,
} from "ce/entities/DataTree/actionTriggers";

export type TriggerMeta = {
  source?: TriggerSource;
  triggerPropertyName?: string;
};

/**
 * The controller saga that routes different trigger effects to its executor sagas
 * @param trigger The trigger information with trigger type
 * @param eventType Widget/Platform event which triggered this action
 * @param triggerMeta Where the trigger originated from
 */
export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
  triggerMeta: TriggerMeta,
): any {
  // when called via a promise, a trigger can return some value to be used in .then
  let response: unknown[] = [];
  switch (trigger.type) {
    case ActionTriggerType.RUN_PLUGIN_ACTION:
      response = yield call(
        executePluginActionTriggerSaga,
        (trigger as RunPluginActionDescription).payload,
        eventType,
        triggerMeta,
      );
      break;
    case ActionTriggerType.CLEAR_PLUGIN_ACTION:
      yield put(
        clearActionResponse(
          (trigger as ClearPluginActionDescription).payload.actionId,
        ),
      );
      break;
    case ActionTriggerType.NAVIGATE_TO:
      yield call(
        navigateActionSaga,
        (trigger as NavigateActionDescription).payload,
      );
      break;
    case ActionTriggerType.SHOW_ALERT:
      yield call(
        showAlertSaga,
        (trigger as ShowAlertActionDescription).payload,
      );
      break;
    case ActionTriggerType.SHOW_MODAL_BY_NAME:
      yield call(openModalSaga, trigger as ShowModalActionDescription);
      break;
    case ActionTriggerType.CLOSE_MODAL:
      yield call(closeModalSaga, trigger as CloseModalActionDescription);
      break;
    case ActionTriggerType.STORE_VALUE:
      yield call(
        storeValueLocally,
        (trigger as StoreValueActionDescription).payload,
      );
      break;
    case ActionTriggerType.REMOVE_VALUE:
      yield call(
        removeLocalValue,
        (trigger as RemoveValueActionDescription).payload,
      );
      break;
    case ActionTriggerType.CLEAR_STORE:
      yield call(clearLocalStore);
      break;
    case ActionTriggerType.DOWNLOAD:
      yield call(downloadSaga, (trigger as DownloadActionDescription).payload);
      break;
    case ActionTriggerType.COPY_TO_CLIPBOARD:
      yield call(copySaga, (trigger as CopyToClipboardDescription).payload);
      break;
    case ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME:
      yield call(
        resetWidgetActionSaga,
        (trigger as ResetWidgetDescription).payload,
      );
      break;
    case ActionTriggerType.SET_INTERVAL:
      yield call(
        setIntervalSaga,
        (trigger as SetIntervalDescription).payload,
        eventType,
        triggerMeta,
      );
      break;
    case ActionTriggerType.CLEAR_INTERVAL:
      yield call(
        clearIntervalSaga,
        (trigger as ClearIntervalDescription).payload,
      );
      break;
    case ActionTriggerType.GET_CURRENT_LOCATION:
      response = yield call(
        getCurrentLocationSaga,
        (trigger as GetCurrentLocationDescription).payload,
        eventType,
        triggerMeta,
      );
      break;

    case ActionTriggerType.WATCH_CURRENT_LOCATION:
      response = yield call(
        watchCurrentLocation,
        (trigger as WatchCurrentLocationDescription).payload,
        eventType,
        triggerMeta,
      );
      break;

    case ActionTriggerType.STOP_WATCHING_CURRENT_LOCATION:
      response = yield call(stopWatchCurrentLocation, eventType, triggerMeta);
      break;
    case ActionTriggerType.CONFIRMATION_MODAL:
      const payloadInfo = {
        name: (trigger as ConfirmationModalDescription)?.payload?.funName,
        modalOpen: true,
        modalType: ModalType.RUN_ACTION,
      };
      const flag = yield call(requestModalConfirmationSaga, payloadInfo);
      if (!flag) {
        throw new UserCancelledActionExecutionError();
      }
      break;
    case ActionTriggerType.POST_MESSAGE:
      yield call(
        postMessageSaga,
        (trigger as PostMessageDescription).payload,
        triggerMeta,
      );
      break;
    default:
      log.error("Trigger type unknown", trigger);
      throw Error("Trigger type unknown");
  }
  return response;
}

export function* executeAppAction(payload: ExecuteTriggerPayload): any {
  const {
    callbackData,
    dynamicString,
    event: { type },
    globalContext,
    source,
    triggerPropertyName,
  } = payload;

  log.debug({ dynamicString, callbackData, globalContext });
  if (dynamicString === undefined) {
    throw new Error("Executing undefined action");
  }

  return yield call(
    evaluateAndExecuteDynamicTrigger,
    dynamicString,
    type,
    { source, triggerPropertyName },
    callbackData,
    globalContext,
  );
}

function* initiateActionTriggerExecution(
  action: ReduxAction<ExecuteTriggerPayload>,
) {
  const { event, source, triggerPropertyName } = action.payload;
  // Clear all error for this action trigger. In case the error still exists,
  // it will be created again while execution
  AppsmithConsole.deleteErrors([
    { id: `${source?.id}-${triggerPropertyName}` },
  ]);
  try {
    yield call(executeAppAction, action.payload);
    if (event.callback) {
      event.callback({ success: true });
    }
  } catch (e) {
    if (e instanceof UncaughtPromiseError || e instanceof TriggerFailureError) {
      logActionExecutionError(e.message, source, triggerPropertyName);
    }
    // handle errors here
    if (event.callback) {
      event.callback({ success: false });
    }
    log.error(e);
  }
}

export function* watchActionExecutionSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.EXECUTE_TRIGGER_REQUEST,
      initiateActionTriggerExecution,
    ),
    takeLatest(
      ReduxActionTypes.SET_APP_VERSION_ON_WORKER,
      setAppVersionOnWorkerSaga,
    ),
    takeLatest(ReduxActionTypes.EVALUATE_SNIPPET, evaluateSnippetSaga),
    takeLatest(ReduxActionTypes.EVALUATE_ARGUMENT, evaluateArgumentSaga),
  ]);
}
