import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ButtonGroup } from './button-group';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group';
import { Label } from './label';
import { BreadcrumbPage } from './breadcrumb';
import { PaginationLink } from './pagination';
import { Spinner } from './spinner';
import { InputOTPSeparator } from './input-otp';
import { Item, ItemGroup, ItemSeparator } from './item';
import { Field, FieldLabel, FieldLegend, FieldSet } from './field';
import { Command, CommandInput } from './command';

describe('UI semantics', () => {
  it('preserves native labelled button groups and disabled behavior', () => {
    render(
      <ButtonGroup aria-label="Map controls" disabled>
        <button type="button">Zoom</button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('group', { name: 'Map controls' }).tagName).toBe(
      'FIELDSET',
    );
    expect(screen.getByRole('button', { name: 'Zoom' })).toBeDisabled();
  });

  it('associates labels with controls explicitly and by nesting', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="city">City</Label>
        <input id="city" />
        <Label>
          Notes
          <input />
        </Label>
      </>,
    );
    await user.click(screen.getByText('City'));
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
  });

  it('keeps addon labels and nested buttons separately operable', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <InputGroup aria-label="Search field">
        <InputGroupInput id="search" />
        <InputGroupAddon htmlFor="search">Search</InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={onClear}>Clear</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    expect(screen.getByRole('group').tagName).toBe('FIELDSET');
    await user.click(screen.getByText('Search'));
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('focuses the command input with an accessible search button and preserves its ref', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    render(
      <Command label="Find a guide">
        <CommandInput ref={ref} />
      </Command>,
    );
    expect(ref.current).toBe(
      screen.getByRole('combobox', { name: 'Find a guide' }),
    );
    await user.click(screen.getByRole('button', { name: 'Focus search' }));
    expect(ref.current).toHaveFocus();
    await user.tab();
    await user.keyboard(' ');
    expect(ref.current).toHaveFocus();
  });

  it('does not expose the current breadcrumb as a disabled link', () => {
    render(<BreadcrumbPage>Current guide</BreadcrumbPage>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Current guide')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps pagination link text, destination and current-page state', () => {
    render(
      <PaginationLink href="?page=2" isActive>
        2
      </PaginationLink>,
    );
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'href',
      '?page=2',
    );
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('announces loading once and hides the decorative icon', () => {
    const { container } = render(<Spinner aria-label="Loading map" />);
    expect(screen.getByRole('status', { name: 'Loading map' }).tagName).toBe(
      'OUTPUT',
    );
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('does not announce a decorative OTP divider as another field', () => {
    const { container } = render(<InputOTPSeparator />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives item groups real list items while preserving polymorphic links', () => {
    const { container } = render(
      <>
        <ItemGroup aria-label="Guides">
          <Item>First guide</Item>
          <ItemSeparator />
          <Item render={<a href="https://example.com/guide">Uffizi</a>}>
            Uffizi
          </Item>
        </ItemGroup>
        <Item>Standalone item</Item>
      </>,
    );
    const list = screen.getByRole('list', { name: 'Guides' });
    expect(list.tagName).toBe('UL');
    expect(
      Array.from(list.children).every((child) => child.tagName === 'LI'),
    ).toBe(true);
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('link', { name: 'Uffizi' })).toHaveAttribute(
      'href',
      'https://example.com/guide',
    );
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('uses FieldSet for group semantics and Field only for individual control layout', () => {
    render(
      <FieldSet>
        <FieldLegend>Visit details</FieldLegend>
        <Field>
          <FieldLabel htmlFor="visitor">Visitor</FieldLabel>
          <input id="visitor" />
        </Field>
      </FieldSet>,
    );
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(
      screen.getByRole('group', { name: 'Visit details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Visitor' }),
    ).toBeInTheDocument();
  });
});
