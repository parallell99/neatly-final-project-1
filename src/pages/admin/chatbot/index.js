import SideBarAdmin from "@/components/layout/SideBarAdmin";
import Button from "@/components/ui/buttons/buttons";
export default function ChatbotAdmin() {
  return (
    <>
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1">
          <span className="headline-5 h-[80px] flex items-center pl-[60px]">Chatbot Setup</span>
          <div className="bg-gray-100 flex-1 p-[60px]">
            <div className="flex flex-col bg-white gap-[40px] px-[80px] pt-[40px] pb-[60px] border border-gray-300">
              <span className="headline-5 text-gray-600">Default Chatbot Messsages</span>
              <div className="flex flex-col gap-2">
                <span>Greeting message *</span>
                <textarea className="border border-gray-400 h-[96px] rounded-[4px]"></textarea>
              </div>
              <div className="flex flex-col gap-2">
                <span>Auto-reply message *</span>
                <textarea className="border border-gray-400 h-[96px] rounded-[4px]"></textarea>
              </div>
              {/* section Suggestion menu & Response */}
              <span className="h-[54px] headline-5 text-gray-600 flex items-end border-t border-gray-300">Suggestion menu & Response</span>
              <div className="bg-gray-100 p-6 flex flex-col gap-6 rounded-[8px]">
                <div className="flex gap-10">
                  <div className="flex flex-col body-1 gap-1 w-[50%]">
                    <span>Topic *</span>
                    <input className="bg-white h-[48px] border border-gray-400 rounded-[8px] p-3"></input>
                  </div>
                  <div className="flex flex-col body-1 gap-1 w-[50%]">
                    <span>Reply format</span>
                    <input className="bg-white h-[48px] border border-gray-400 rounded-[8px] p-3" placeholder="Select reply format"></input>
                  </div>
                </div>
                <div className="flex gap-6">
                  <Button buttonText="Save" buttonStyle="primary" className="w-[100px]" />
                  <button className="font-semibold text-gray-700">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}