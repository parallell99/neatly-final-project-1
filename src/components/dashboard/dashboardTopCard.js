import Decrease from "@/assets/icons/decrease-trend-line.svg";
import Increase from "@/assets/icons/increase-trend-line.svg";

function DashboardTopCard({
    label,
    value,
    percentChange,
    trend,
    type,
    currency,
    icon: Icon,
}) {
    const formattedValue =
        type === "currency"
            ? new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: currency || "THB",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(value)
            : value.toLocaleString();

    return (
        <div className="rounded-[8px] border border-gray-300 p-[16px] bg-white flex flex-col gap-[8px] relative">
            <span className="body-1 text-gray-900">{label}</span>

            <h4 className="headline-4 text-gray-900">
                {formattedValue}
            </h4>

            {trend === "up" && (
                <div className="flex items-center gap-[8px]">
                    <Increase />
                    <span className="body-3 text-green-600">
                        Up {percentChange}% from last month
                    </span>
                </div>
            )}

            {trend === "down" && (
                <div className="flex items-center gap-[8px]">
                    <Decrease />
                    <span className="body-3 text-[#F93C65]">
                        Down {Math.abs(percentChange)}% from last month
                    </span>
                </div>
            )}

            {trend === "neutral" && (
                <span className="body-3 text-gray-500">
                    No change from last month
                </span>
            )}

            <div className="bg-gray-300 h-[48px] w-[48px] rounded-full absolute right-0 top-0 m-[16px] flex justify-center items-center">
            {Icon && <Icon className="w-[28px] text-gray-700 stroke-[0.1]" />}
            </div>
        </div>
    );
}

export default DashboardTopCard