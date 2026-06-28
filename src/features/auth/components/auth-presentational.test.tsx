import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseFormRegisterReturn } from "react-hook-form";
import { renderWithIntl } from "@/test/render";
import { SelectionLayout } from "./SelectionLayout";
import { ResendButton } from "./ResendButton";
import { BranchSelector } from "./BranchSelector";
import { ProfileCard } from "./ProfileCard";
import { StepIndicator } from "./StepIndicator";
import { PhoneInput } from "./PhoneInput";
import { PasswordInput } from "./PasswordInput";
import { OTPInput } from "./OTPInput";

function makeRegistration(name: string): UseFormRegisterReturn {
  return {
    name,
    onChange: vi.fn(async () => {}),
    onBlur: vi.fn(async () => {}),
    ref: vi.fn(),
  };
}

describe("SelectionLayout", () => {
  it("renders title, subtitle, children and actions", () => {
    render(
      <SelectionLayout
        title="Pick one"
        subtitle="Helper text"
        actions={<button type="button">Go</button>}
      >
        <p>Body content</p>
      </SelectionLayout>,
    );

    expect(screen.getByRole("heading", { name: "Pick one" })).toBeInTheDocument();
    expect(screen.getByText("Helper text")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("omits the subtitle and actions when not provided", () => {
    render(
      <SelectionLayout title="Only title">
        <span>child</span>
      </SelectionLayout>,
    );

    expect(screen.getByRole("heading", { name: "Only title" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("ResendButton", () => {
  it("shows the resend label and fires onClick when idle", () => {
    const onClick = vi.fn();
    render(
      <ResendButton
        cooldownSeconds={0}
        isPending={false}
        onClick={onClick}
        resendLabel="Resend code"
        pendingLabel="Sending..."
        cooldownLabel={(s) => `Wait ${s}s`}
      />,
    );

    const button = screen.getByRole("button", { name: "Resend code" });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and shows the cooldown label during cooldown", () => {
    render(
      <ResendButton
        cooldownSeconds={12}
        isPending={false}
        onClick={vi.fn()}
        resendLabel="Resend code"
        pendingLabel="Sending..."
        cooldownLabel={(s) => `Wait ${s}s`}
      />,
    );

    const button = screen.getByRole("button", { name: "Wait 12s" });
    expect(button).toBeDisabled();
  });

  it("is disabled and shows the pending label while pending", () => {
    render(
      <ResendButton
        cooldownSeconds={0}
        isPending
        onClick={vi.fn()}
        resendLabel="Resend code"
        pendingLabel="Sending..."
        cooldownLabel={(s) => `Wait ${s}s`}
      />,
    );

    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  });
});

describe("BranchSelector", () => {
  const branches = [
    { id: "b1", isMain: true, label: "Main Branch" },
    { id: "b2", isMain: false, label: "Maadi" },
  ];

  it("renders each branch and marks the main one", () => {
    render(
      <BranchSelector
        title="Branch"
        branches={branches}
        selectedBranchId={null}
        onChange={vi.fn()}
        mainBranchLabel="MAIN"
      />,
    );

    expect(screen.getByText("Main Branch")).toBeInTheDocument();
    expect(screen.getByText("Maadi")).toBeInTheDocument();
    expect(screen.getByText("MAIN")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("calls onChange with the branch id when a branch is picked", () => {
    const onChange = vi.fn();
    render(
      <BranchSelector
        title="Branch"
        branches={branches}
        selectedBranchId={null}
        onChange={onChange}
        mainBranchLabel="MAIN"
      />,
    );

    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(onChange).toHaveBeenCalledWith("b2");
  });

  it("checks the selected branch radio", () => {
    render(
      <BranchSelector
        title="Branch"
        branches={branches}
        selectedBranchId="b1"
        onChange={vi.fn()}
        mainBranchLabel="MAIN"
      />,
    );

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });
});

describe("ProfileCard", () => {
  it("renders organization, roles and branch count and reflects selection", () => {
    render(
      <ProfileCard
        organizationName="Cradlen Clinic"
        branchCountLabel="2 branches"
        isSelected
        onSelect={vi.fn()}
        rolesLabel="Owner"
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("2 branches")).toBeInTheDocument();
  });

  it("fires onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <ProfileCard
        organizationName="Cradlen Clinic"
        branchCountLabel="1 branch"
        isSelected={false}
        onSelect={onSelect}
        rolesLabel="Doctor"
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
});

describe("StepIndicator", () => {
  it("renders all three step numbers", () => {
    renderWithIntl(<StepIndicator currentStep={2} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("PhoneInput", () => {
  it("renders the label/input and shows the error message", () => {
    render(
      <PhoneInput
        id="phone"
        label="Phone"
        placeholder="+20..."
        registration={makeRegistration("phone")}
        error="Invalid number"
        inputClassName="base"
        errorInputClassName="err"
      />,
    );

    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveClass("err");
    expect(screen.getByText("Invalid number")).toBeInTheDocument();
  });

  it("renders without error styling when there is no error", () => {
    render(
      <PhoneInput
        id="phone"
        label="Phone"
        placeholder="+20..."
        registration={makeRegistration("phone")}
        inputClassName="base"
        errorInputClassName="err"
      />,
    );

    expect(screen.getByLabelText("Phone")).not.toHaveClass("err");
  });
});

describe("PasswordInput", () => {
  it("toggles the input between password and text", () => {
    render(
      <PasswordInput
        id="pwd"
        label="Password"
        placeholder="••••"
        registration={makeRegistration("password")}
        inputClassName="base"
        errorInputClassName="err"
        showLabel="Show"
        hideLabel="Hide"
      />,
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: /Show/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Show/ }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /Hide/ })).toBeInTheDocument();
  });

  it("shows the error message when present", () => {
    render(
      <PasswordInput
        id="pwd"
        label="Password"
        placeholder="••••"
        registration={makeRegistration("password")}
        error="Too short"
        inputClassName="base"
        errorInputClassName="err"
        showLabel="Show"
        hideLabel="Hide"
      />,
    );

    expect(screen.getByText("Too short")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveClass("err");
  });
});

describe("OTPInput", () => {
  it("renders one box per digit and emits the typed value", () => {
    const onChange = vi.fn();
    render(<OTPInput value="" onChange={onChange} ariaLabel="Code" />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);

    fireEvent.change(inputs[0], { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("honors a custom length", () => {
    render(<OTPInput value="" onChange={vi.fn()} ariaLabel="Code" length={4} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("fills all digits from a pasted value", () => {
    const onChange = vi.fn();
    render(<OTPInput value="" onChange={onChange} ariaLabel="Code" />);

    fireEvent.paste(screen.getAllByRole("textbox")[0], {
      clipboardData: { getData: () => "123456" },
    });
    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("disables every box when disabled", () => {
    render(<OTPInput value="" onChange={vi.fn()} ariaLabel="Code" disabled />);
    screen
      .getAllByRole("textbox")
      .forEach((input) => expect(input).toBeDisabled());
  });
});
