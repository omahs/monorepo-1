import { jsonifyError, RequestContext } from "@connext/nxtp-utils";

import { alertViaBetterUptime, alertViaDiscord, alertViaPagerDuty, alertViaSms, alertViaTelegram } from "./alert";
import { Pauser } from "./pause";
import {
  Verifier,
  VerifierContext,
  AssetInfo,
  Report,
  PauseResponse,
  VerifyResponse,
  WatcherAlertsConfig,
} from "./types";
import { AssetVerifier } from "./verifiers";

// Aggregation class for interfacing with all adapter functionality.
export class WatcherAdapter {
  private readonly verifiers: Verifier[];
  private readonly pauser: Pauser;

  constructor(context: VerifierContext, assets: AssetInfo[]) {
    // Should set all applicable verifiers here!
    this.verifiers = [new AssetVerifier(context, assets)];
    this.pauser = new Pauser(context);
  }

  // TODO: Return invariant check value and let consumer decide whether to pause, or immediately try to pause?
  public async checkInvariants(requestContext: RequestContext): Promise<VerifyResponse> {
    for (const verifier of this.verifiers) {
      const result = await verifier.checkInvariant(requestContext);
      if (result.needsPause) {
        return result;
      }
    }
    return {
      needsPause: false,
    };
  }

  public async pause(_requestContext: RequestContext, reason: string, domains: string[]): Promise<PauseResponse[]> {
    // TODO: Check to make sure domains are subset of what was provided in VerifierContext in constructor...?
    return await this.pauser.pause(reason, domains);
  }

  public async alert(report: Report, config: WatcherAlertsConfig): Promise<void> {
    const { requestContext, methodContext, logger, ...res } = report;

    const {
      discordHookUrl,
      pagerDutyRoutingKey,
      twilioNumber,
      twilioAccountSid,
      twilioAuthToken,
      twilioToPhoneNumbers,
      telegramApiKey,
      telegramChatId,
      betterUptimeApiKey,
      betterUptimeRequesterEmail,
    } = config;

    const discordAlert = !!discordHookUrl;
    const pagerDutyAlert = !!pagerDutyRoutingKey;
    const smsAlert = !!(twilioAccountSid && twilioAuthToken && twilioNumber && twilioToPhoneNumbers?.length);
    const telegramAlert = telegramApiKey && telegramChatId;
    const betterUptimeAlert = !!(betterUptimeApiKey && betterUptimeRequesterEmail);
    logger.info("alert: Attempt to alert", requestContext, methodContext, {
      report: res,
      alerts: {
        discord: discordAlert,
        pagerDuty: pagerDutyAlert,
        sms: smsAlert,
        telegram: telegramAlert,
        betterUptime: betterUptimeAlert,
      },
    });

    const errors = await Promise.all([
      // attempt to alert via discord
      (async () => {
        if (discordAlert) {
          try {
            await alertViaDiscord(report, discordHookUrl);
          } catch (e: unknown) {
            logger.error("alert: failed to alert via discord", requestContext, methodContext, jsonifyError(e as Error));
            return e;
          }
        }
      })(),
      // attempt to alert via pager duty
      (async () => {
        if (pagerDutyAlert) {
          try {
            await alertViaPagerDuty(report, pagerDutyRoutingKey);
          } catch (e: unknown) {
            logger.error(
              "alert: failed to alert via pager duty",
              requestContext,
              methodContext,
              jsonifyError(e as Error),
            );
            return e;
          }
        }
      })(),
      // attempt to alert via sms (twilio service)
      (async () => {
        if (smsAlert) {
          try {
            await alertViaSms(report, twilioAccountSid, twilioAuthToken, twilioNumber, twilioToPhoneNumbers);
          } catch (e: unknown) {
            logger.error("alert: failed to alert via sms", requestContext, methodContext, jsonifyError(e as Error));
            return e;
          }
        }
      })(),
      // attempt to alert via telegram
      (async () => {
        if (telegramAlert) {
          try {
            await alertViaTelegram(report, telegramApiKey, telegramChatId);
          } catch (e: unknown) {
            logger.error(
              "alert: failed to alert via telegram",
              requestContext,
              methodContext,
              jsonifyError(e as Error),
            );
            return e;
          }
        }
      })(),
      // attempt to alert via telegram
      (async () => {
        if (betterUptimeAlert) {
          try {
            await alertViaBetterUptime(report, betterUptimeApiKey, betterUptimeRequesterEmail);
          } catch (e: unknown) {
            logger.error(
              "alert: failed to alert via better uptime",
              requestContext,
              methodContext,
              jsonifyError(e as Error),
            );
            return e;
          }
        }
      })(),
    ]);

    if (errors.filter((x) => !!x).length > 0) {
      throw errors;
    }
  }
}
