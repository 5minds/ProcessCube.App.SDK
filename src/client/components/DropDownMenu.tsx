import { Menu, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';
import { classNames } from '../utils/classNames';

// TODO split this up from DynamicUi.css; dont use dui varialbes here

export function DropDownMenu(props: { children: React.ReactNode; collapsedIcon?: React.ReactNode }) {
  return (
    <Menu as="div" className="app-sdk-relative app-sdk-inline-block app-sdk-text-left">
      <div>
        <Menu.Button className="app-sdk-flex app-sdk-items-center app-sdk-rounded-full app-sdk-text-[color:var(--dui-header-dropdown-icon-text-color)] hover:app-sdk-text-[color:var(--dui-header-dropdown-icon-text-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--dui-focus-color)]  ">
          <span className="app-sdk-sr-only">Open options</span>
          {props.collapsedIcon || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="app-sdk-h-5 app-sdk-w-5"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
            </svg>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="app-sdk-transition app-sdk-ease-out app-sdk-duration-100"
        enterFrom="app-sdk-transform app-sdk-opacity-0 app-sdk-scale-95"
        enterTo="app-sdk-transform app-sdk-opacity-100 app-sdk-scale-100"
        leave="app-sdk-transition app-sdk-ease-in app-sdk-duration-75"
        leaveFrom="app-sdk-transform app-sdk-opacity-100 app-sdk-scale-100"
        leaveTo="app-sdk-transform app-sdk-opacity-0 app-sdk-scale-95"
      >
        <Menu.Items className="app-sdk-absolute app-sdk-right-0 app-sdk-z-10 app-sdk-mt-2 app-sdk-w-56 app-sdk-origin-top-right app-sdk-rounded-md app-sdk-bg-[color:var(--dui-header-dropdown-menu-background-color)] app-sdk-shadow-lg app-sdk-ring-1 app-sdk-ring-black app-sdk-ring-opacity-5 focus:app-sdk-outline-none">
          <div className="app-sdk-py-1">{props.children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export function DropDownMenuItem(props: {
  title: string | JSX.Element;
  onClick: () => void | Promise<void>;
  isDanger?: boolean;
  classNames?: string;
}): JSX.Element {
  return (
    <Menu.Item>
      {({ active }) => {
        const dangerClass = 'app-sdk-text-[color:var(--dui-header-dropdown-menu-danger-entry-text-color)]';
        const defaultClass = 'app-sdk-text-[color:var(--dui-header-dropdown-menu-default-entry-text-color)]';
        return (
          <button
            type="button"
            onClick={() => props.onClick()}
            className={classNames(
              active ? 'app-sdk-bg-[color:var(--dui-header-dropdown-menu-entry-background-hover-color)]' : '',
              'app-sdk-block app-sdk-w-full app-sdk-px-4 app-sdk-py-2 app-sdk-text-left app-sdk-text-sm',
              props.isDanger ? dangerClass : defaultClass,
              props.classNames ?? '',
            )}
          >
            {props.title}
          </button>
        );
      }}
    </Menu.Item>
  );
}
