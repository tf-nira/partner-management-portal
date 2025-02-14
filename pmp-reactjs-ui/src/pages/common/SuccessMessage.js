import cancelIcon from '../../svg/cancel_icon.svg';

function SuccessMessage({ successMsg, clickOnCancel}) {
    return (
        <>
            <div className="mr-6">
                <p className="text-sm/4 text-white break-words font-inter">
                    {successMsg}
                </p>
            </div>
            <div className="mr-3 ml-5 absolute top-4 right-2">
                <img src={cancelIcon} alt="" className="cursor-pointer" onClick={clickOnCancel}></img>
            </div>
        </>
    );
}

export default SuccessMessage;