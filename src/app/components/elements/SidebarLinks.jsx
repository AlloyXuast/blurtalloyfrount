import tt from 'counterpart';

const SidebarLinks = ({ username }) => (
    <div className="c-sidebar__module">
        <div className="c-sidebar__header">
            <h3 className="c-sidebar__h3">{tt('g.links')}</h3>
        </div>
        <div className="c-sidebar__content">
            <ul className="c-sidebar__list">
                <li className="c-sidebar__list-item" key="feed">
                    <a className="c-sidebar__link" href={`/@${username}/feed`}>
                        {tt('g.my_feed')}
                    </a>
                </li>

                <li className="c-sidebar__list-item">
                    <a className="c-sidebar__link" href={'/@' + username}>
                        {tt('g.my_blog')}
                    </a>
                </li>
                <li className="c-sidebar__list-item">
                    <a
                        className="c-sidebar__link"
                        href={'/@' + username + '/notifications'}
                    >
                        {tt('g.my_notifications')}
                    </a>
                </li>
                <li className="c-sidebar__list-item">
                    <a
                        className="c-sidebar__link"
                        href={'https://blurtwallet.alloyxuast.co.uk/@' + username + ''}
                    >
                        {tt('g.my_wallet')}
                    </a>
                </li>
                <li className="c-sidebar__list-item">
                    <a
                        className="c-sidebar__link"
                        href={'https://blocks.blurtwallet.com/#/@' + username}
                    >
                        {tt('g.my_explorer')}
                    </a>
                </li>
                <li className="c-sidebar__list-item">
                    {/* <a className="c-sidebar__link" href="/@steemitblog"> */}
                    {/*    {tt('g.read_offical_blog')} */}
                    {/* </a> */}
                </li>
            </ul>
        </div>
    </div>
);

export default SidebarLinks;
