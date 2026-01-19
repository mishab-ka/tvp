import React from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Icon from "../../../components/AppIcon";

const OtherChargesForm = ({ charges = [], onChange }) => {
  const handleAddCharge = () => {
    const newCharge = {
      id: Date.now(),
      description: "",
      amount: "",
      type: "+",
    };
    onChange([...charges, newCharge]);
  };

  const handleRemoveCharge = (id) => {
    onChange(charges.filter((charge) => charge.id !== id));
  };

  const handleUpdateCharge = (id, field, value) => {
    onChange(
      charges.map((charge) =>
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    );
  };

  const totalOtherCharges = charges.reduce((sum, charge) => {
    const amount = parseFloat(charge.amount) || 0;
    return charge.type === "+" ? sum + amount : sum - amount;
  }, 0);

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            Other Charges
          </h4>
          <p className="text-sm text-muted-foreground">
            Add additional charges or adjustments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCharge}
          iconName="Plus"
          iconPosition="left"
        >
          Add Other Charge
        </Button>
      </div>

      {charges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No other charges added</p>
          <p className="text-sm mt-2">
            Click "Add Other Charge" to add additional charges or adjustments
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {charges.map((charge, index) => (
            <div
              key={charge.id}
              className="p-4 bg-muted/20 rounded-lg border border-border space-y-4"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-foreground">
                  Other Charge {index + 1}
                </h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCharge(charge.id)}
                  iconName="Trash"
                  iconSize={14}
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={charge.description}
                    onChange={(e) =>
                      handleUpdateCharge(charge.id, "description", e.target.value)
                    }
                    placeholder="Enter charge description (e.g., Fuel adjustment, Penalty waiver)"
                    required
                  />
                </div>
                <div>
                  <Select
                    label="Type"
                    options={[
                      { value: "+", label: "+ (Add to total)" },
                      { value: "-", label: "- (Subtract from total)" },
                    ]}
                    value={charge.type}
                    onChange={(value) =>
                      handleUpdateCharge(charge.id, "type", value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Amount (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={charge.amount}
                  onChange={(e) =>
                    handleUpdateCharge(charge.id, "amount", e.target.value)
                  }
                  required
                  description={
                    charge.type === "+"
                      ? "This amount will be added to the final total"
                      : "This amount will be subtracted from the final total"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {charges.length > 0 && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">
                Total Other Charges
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sum of all other charges (additions - subtractions)
              </p>
            </div>
            <span
              className={`text-lg font-bold ${
                totalOtherCharges >= 0 ? "text-success" : "text-error"
              }`}
            >
              {totalOtherCharges >= 0 ? "+" : ""}
              {totalOtherCharges.toFixed(2)} INR
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherChargesForm;



