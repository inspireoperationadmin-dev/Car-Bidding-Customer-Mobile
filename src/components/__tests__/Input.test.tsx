import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import Input from '../Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    const {getByText} = render(<Input label="Test Label" />);
    expect(getByText('Test Label')).toBeTruthy();
  });

  it('displays error message when error prop is provided', () => {
    const {getByText} = render(<Input error="Invalid input" />);
    expect(getByText('Invalid input')).toBeTruthy();
  });

  it('handles text changes correctly', () => {
    const onChangeTextMock = jest.fn();
    const {getByPlaceholderText} = render(
      <Input placeholder="Enter text" onChangeText={onChangeTextMock} />
    );

    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'New Value');

    expect(onChangeTextMock).toHaveBeenCalledWith('New Value');
  });
});
