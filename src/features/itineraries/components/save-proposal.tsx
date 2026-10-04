import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { textLinkClassName } from '@/shared/ui/text-link';

import { useSaveItinerary } from '../api/saved-itineraries';
import type { Proposal } from '../types';
import { NameForm } from './name-form';

interface SaveProposalProps {
  readonly proposal: Proposal;
  readonly defaultName: string;
}

/** Saves a proposal to My itineraries; signed out, invites to sign in. */
export function SaveProposal({ proposal, defaultName }: SaveProposalProps) {
  const { t } = useTranslation('itineraries');
  const { session } = useAuth();
  const save = useSaveItinerary();
  // The proposals change with each search: remember which one the form or answer is for.
  const [naming, setNaming] = useState<Proposal>();
  const answered = save.variables?.proposal === proposal;

  if (!session) {
    return (
      <Link to="/sign-in" className={`text-sm ${textLinkClassName}`}>
        {t('saved.signInToSave')}
      </Link>
    );
  }
  if (answered && save.isSuccess) {
    return (
      <p role="status" className="text-sm text-moss">
        {t('saved.done')}{' '}
        <Link to="/itineraries" className={textLinkClassName}>
          {t('saved.title')}
        </Link>
      </p>
    );
  }
  if (naming !== proposal) {
    return (
      <Button
        type="button"
        size="sm"
        className="self-start"
        onClick={() => {
          setNaming(proposal);
        }}
      >
        {t('saved.save')}
      </Button>
    );
  }
  const saveAs = (name: string) => {
    save.mutate({ name, proposal });
  };
  return (
    <div className="flex flex-col gap-3">
      <NameForm
        label={t('saved.saveAs', { name: defaultName })}
        initialName={defaultName}
        pending={save.isPending}
        onSubmit={saveAs}
        onCancel={() => {
          setNaming(undefined);
        }}
      />
      {answered && save.error && (
        <ErrorNotice
          error={save.error}
          onRetry={() => {
            saveAs(save.variables.name);
          }}
        />
      )}
    </div>
  );
}
