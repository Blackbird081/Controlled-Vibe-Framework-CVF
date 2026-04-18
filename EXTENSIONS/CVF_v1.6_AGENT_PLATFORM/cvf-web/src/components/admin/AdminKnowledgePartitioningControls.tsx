'use client';

import { useMemo, useState } from 'react';

type KnowledgeCollectionView = {
  id: string;
  name: string;
  description: string;
  orgId: string | null;
  teamId: string | null;
  chunkCount: number;
};

type OrgOption = {
  id: string;
  name: string;
};

type TeamOption = {
  id: string;
  orgId: string;
  name: string;
};

export function AdminKnowledgePartitioningControls({
  initialCollections,
  organizations,
  teams,
}: {
  initialCollections: KnowledgeCollectionView[];
  organizations: OrgOption[];
  teams: TeamOption[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [savingCollectionId, setSavingCollectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const organizationsById = useMemo(
    () => new Map(organizations.map(org => [org.id, org])),
    [organizations],
  );
  const teamsById = useMemo(
    () => new Map(teams.map(team => [team.id, team])),
    [teams],
  );

  const updateCollection = (
    collectionId: string,
    patch: Partial<Pick<KnowledgeCollectionView, 'orgId' | 'teamId'>>,
  ) => {
    setCollections(current => current.map(collection => {
      if (collection.id !== collectionId) return collection;
      return { ...collection, ...patch };
    }));
    setError(null);
    setSuccess(null);
  };

  const saveScope = async (collectionId: string) => {
    const collection = collections.find(entry => entry.id === collectionId);
    if (!collection) return;

    setSavingCollectionId(collectionId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/tool-registry/knowledge-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          orgId: collection.orgId,
          teamId: collection.teamId,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to update knowledge collection scope.');
      }

      setCollections(current => current.map(entry => (
        entry.id === collectionId
          ? {
            ...entry,
            orgId: payload.data.orgId,
            teamId: payload.data.teamId,
          }
          : entry
      )));
      setSuccess(`Saved scope for ${collection.name}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update knowledge collection scope.');
    } finally {
      setSavingCollectionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
        <div className="font-semibold">Knowledge partitioning is now runtime-enforced</div>
        <p className="mt-2">
          `/api/execute` retrieves governed knowledge chunks through a scoped adapter. Collections below define which org/team can contribute context to the execute path.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {collections.map(collection => {
          const availableTeams = collection.orgId
            ? teams.filter(team => team.orgId === collection.orgId)
            : teams;

          return (
            <article
              key={collection.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">Chunks: {collection.chunkCount}</div>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{collection.name}</h3>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                  {collection.teamId
                    ? 'TEAM-SCOPED'
                    : collection.orgId
                      ? 'ORG-SCOPED'
                      : 'GLOBAL'}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{collection.description}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-2 block font-medium text-gray-700 dark:text-gray-200">Organization Scope</span>
                  <select
                    value={collection.orgId ?? ''}
                    onChange={event => updateCollection(collection.id, {
                      orgId: event.target.value || null,
                      teamId: collection.teamId && teamsById.get(collection.teamId)?.orgId === event.target.value
                        ? collection.teamId
                        : null,
                    })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  >
                    <option value="">Global (all orgs)</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-2 block font-medium text-gray-700 dark:text-gray-200">Team Scope</span>
                  <select
                    value={collection.teamId ?? ''}
                    onChange={event => {
                      const nextTeamId = event.target.value || null;
                      const nextTeam = nextTeamId ? teamsById.get(nextTeamId) : null;
                      updateCollection(collection.id, {
                        teamId: nextTeamId,
                        orgId: nextTeam?.orgId ?? collection.orgId,
                      });
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  >
                    <option value="">No team restriction</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
                <div className="font-medium text-gray-900 dark:text-white">Effective Scope</div>
                <div className="mt-1 text-gray-600 dark:text-gray-300">
                  {collection.teamId
                    ? `${organizationsById.get(collection.orgId ?? '')?.name ?? collection.orgId} / ${teamsById.get(collection.teamId)?.name ?? collection.teamId}`
                    : collection.orgId
                      ? `${organizationsById.get(collection.orgId)?.name ?? collection.orgId} / all teams`
                      : 'Global — visible to all orgs and teams'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => saveScope(collection.id)}
                disabled={savingCollectionId === collection.id}
                className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCollectionId === collection.id ? 'Saving...' : 'Save Scope'}
              </button>
            </article>
          );
        })}
      </div>

      {(error || success) && (
        <div>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
