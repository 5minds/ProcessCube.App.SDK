import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from '@headlessui/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import { classNames } from '../../utils/classNames';

export type CommandPaletteEntry = {
  id: string;
  name: string;
};

export type CommandPaletteProps<T extends CommandPaletteEntry> = {
  isOpen: boolean;
  placeholder: string;
  entries: T[];
  onConfirm: (entry: T) => void;
  onClose: () => void;
};

export function CommandPalette<T extends CommandPaletteEntry>(props: CommandPaletteProps<T>) {
  const [query, setQuery] = useState('');

  const filteredEntries =
    query === ''
      ? props.entries
      : props.entries.filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog
      className="app-sdk-relative app-sdk-z-10"
      open={props.isOpen}
      onClose={() => {
        props.onClose();
        setQuery('');
      }}
    >
      <DialogBackdrop
        transition
        className="app-sdk-fixed app-sdk-inset-0 app-sdk-bg-gray-500 app-sdk-bg-opacity-25 app-sdk-transition-opacity data-[closed]:app-sdk-opacity-0 data-[enter]:app-sdk-duration-300 data-[leave]:app-sdk-duration-150 data-[enter]:app-sdk-ease-out data-[leave]:app-sdk-ease-in"
      />

      <div className="app-sdk-fixed app-sdk-inset-0 app-sdk-z-10 app-sdk-w-screen app-sdk-overflow-y-auto app-sdk-p-4 sm:app-sdk-p-6 md:app-sdk-p-20">
        <DialogPanel
          transition
          className="app-sdk-mx-auto app-sdk-max-w-xl app-sdk-transform app-sdk-rounded-xl app-sdk-bg-[color:var(--asdk-cmdp-background-color)] app-sdk-p-2 app-sdk-shadow-2xl app-sdk-ring-1 app-sdk-ring-black app-sdk-ring-opacity-5 app-sdk-transition-all data-[closed]:app-sdk-scale-95 data-[closed]:app-sdk-opacity-0 data-[enter]:app-sdk-duration-300 data-[leave]:app-sdk-duration-150 data-[enter]:app-sdk-ease-out data-[leave]:app-sdk-ease-in"
        >
          <Combobox
            onChange={(entry: T) => {
              if (entry) {
                props.onConfirm(entry);
              }
            }}
          >
            <ComboboxInput
              autoFocus
              className="app-sdk-w-full app-sdk-ring-offset-2 app-sdk-rounded-md app-sdk-border-0 app-sdk-bg-[color:var(--asdk-cmdp-input-color)] app-sdk-px-4 app-sdk-py-2.5 app-sdk-text-[color:var(--asdk-cmdp-text-color)] sm:app-sdk-text-sm"
              placeholder={props.placeholder}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => setQuery('')}
            />

            {filteredEntries.length > 0 && (
              <ComboboxOptions
                static
                className="app-sdk-mb-2 app-sdk-max-h-72 app-sdk-scroll-py-2 app-sdk-overflow-y-auto app-sdk-py-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-cmdp-text-color)]"
              >
                {filteredEntries.map((entry) => (
                  <ComboboxOption
                    key={entry.id}
                    value={entry}
                    className={({ focus }) =>
                      classNames(
                        'app-sdk-cursor-default app-sdk-select-none app-sdk-rounded-md app-sdk-px-4 app-sdk-py-2',
                        focus && 'app-sdk-bg-[color:var(--asdk-cmdp-focus-color)] app-sdk-text-white',
                      )
                    }
                  >
                    {entry.name}
                  </ComboboxOption>
                ))}
              </ComboboxOptions>
            )}

            {query !== '' && filteredEntries.length === 0 && (
              <div className="app-sdk-px-4 app-sdk-py-14 app-sdk-text-center sm:app-sdk-px-14">
                <UsersIcon
                  className="app-sdk-mx-auto app-sdk-h-6 app-sdk-w-6 app-sdk-text-gray-400"
                  aria-hidden="true"
                />
                <p className="app-sdk-mt-4 app-sdk-text-sm app-sdk-text-[color:var(--asdk-cmdp-text-color)]">
                  No entries found using that search term.
                </p>
              </div>
            )}
          </Combobox>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
