"use client";

import type { Locale } from "@/lib/i18n";
import {
  archiveOpportunity,
  deleteOpportunity,
  restoreOpportunity,
} from "../actions";

type Props = {
  locale: Locale;
  opportunityId: string;
  archived: boolean;
};

export function OpportunityLifecycleActions({
  locale,
  opportunityId,
  archived,
}: Props) {
  const ua = locale === "uk";

  return (
    <div className="opportunityLifecycle">
      <div>
        <div className="eyebrow">
          {ua ? "Життєвий цикл" : "Lifecycle"}
        </div>
        <p>
          {archived
            ? ua
              ? "Ця можливість в архіві та не відображається у публічному каталозі."
              : "This opportunity is archived and is not visible in the public directory."
            : ua
              ? "Архівування прибирає можливість з публічного каталогу, але зберігає її та всю історію взаємодій."
              : "Archive removes the opportunity from the public directory while preserving the record and interaction history."}
        </p>
      </div>

      <div className="opportunityLifecycleButtons">
        {archived ? (
          <form action={restoreOpportunity}>
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="opportunityId" value={opportunityId} />
            <button className="button" type="submit">
              {ua ? "Відновити з архіву" : "Restore from archive"}
            </button>
          </form>
        ) : (
          <form action={archiveOpportunity}>
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="opportunityId" value={opportunityId} />
            <button className="button" type="submit">
              {ua ? "В архів" : "Archive"}
            </button>
          </form>
        )}

        <form
          action={deleteOpportunity}
          onSubmit={(event) => {
            const ok = window.confirm(
              ua
                ? "Видалити цю можливість назавжди? Якщо вже є запити «Я зацікавлений», видалення буде заблоковано і потрібно використати архів."
                : "Delete this opportunity permanently? If it already has interest requests, deletion will be blocked and you should archive it instead.",
            );
            if (!ok) event.preventDefault();
          }}
        >
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <button className="button dangerButton" type="submit">
            {ua ? "Видалити назавжди" : "Delete permanently"}
          </button>
        </form>
      </div>

      <small>
        {ua
          ? "Постійнe видалення дозволене лише якщо за цією можливістю ще немає Interest Requests."
          : "Permanent deletion is only allowed while the opportunity has no Interest Requests."}
      </small>
    </div>
  );
}
