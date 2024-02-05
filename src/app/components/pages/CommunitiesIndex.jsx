import React from 'react';
import { connect } from 'react-redux';
import tt from 'counterpart';
import { Map, List } from 'immutable';
import { actions as fetchDataSagaActions } from 'app/redux/FetchDataSaga';
import SubscribeButton from 'app/components/elements/SubscribeButton';
import { Link } from 'react-router';
import PostsIndexLayout from 'app/components/pages/PostsIndexLayout';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import UserNames from 'app/components/elements/UserNames';
import ElasticSearchInput from 'app/components/elements/ElasticSearchInput';
import NativeSelect from 'app/components/elements/NativeSelect';

export default class CommunitiesIndex extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchQuery: undefined,
            searchOrder: 'rank',
        };

        const {
            performSearch, username, searchQuery, searchOrder
        } = props;
        performSearch(username, searchQuery, searchOrder);
    }

    componentDidUpdate = (prevProps) => {
        const {
            performSearch, username, searchQuery, searchOrder
        } = this.props;

        if (prevProps.username !== username) {
            performSearch(username, searchQuery, searchOrder);
        }
    };

    render() {
        const {
            communities, communities_idx, username, walletUrl, performSearch
        } = this.props;
        const ordered = communities_idx !== null
                ? communities_idx.map((name) => {
                      return communities.get(name);
                  })
                : [];

        const sortOptions = [
            {
                value: 'rank',
                label: 'Rank',
            },
            {
                value: 'subs',
                label: 'Subscribers',
            },
            {
                value: 'new',
                label: 'New',
            },
        ];

        const role = (comm) => {
            return (
                comm.context && comm.context.role !== 'guest' && <span className="user_role">{comm.context.role}</span>
            );
        };

        const communityAdmins = (admins) => {
            if (!admins || admins.length === 0) return null;

            return (
                <div>
                    {admins.length === 1 ? `${tt('g.administrator')}: ` : `${tt('g.administrators')}: `}
                    <UserNames names={admins} />
                </div>
            );
        };

        const row = (comm) => {
            const admins = communityAdmins(comm.admins);
            return (
                <tr key={comm.name}>
                    <th>
                        <Link className="title" to={`/trending/${comm.name}`}>
                            {comm.title}
                        </Link>
                        {role(comm)}
                        <br />
                        {comm.about}
                        <small>
                            {`${comm.subscribers} ${comm.subscribers === 1 ? 'subscriber' : 'subscribers'} `}
                            &bull;
                            {` ${comm.num_authors} posters`} 
                            &bull; 
                            {` ${comm.num_pending} posts`}
                            {admins}
                        </small>
                    </th>
                    <td>
                        <SubscribeButton community={comm.name} />
                    </td>
                </tr>
            );
        };

        const { searchQuery, searchOrder } = this.state;

        return (
            <PostsIndexLayout 
                blogmode={false} 
                category={this.props.routeParams.category} 
                order={this.props.routeParams.order} 
                topic={this.props.params.category} 
            >
                <div className="CommunitiesIndex c-sidebar__module">
                    {username && (
                        <div style={{ float: 'right' }}>
                            <a href={`${walletUrl}/@${username}/communities`}>Create a Community</a>
                        </div>
                    )}

                    <h4>
                        {tt('g.community_list_header')}
                    </h4>
                    <div className="articles__header row">
                        <div className="small-8 medium-7 large-8 column">
                            <ElasticSearchInput
                                expanded
                                handleSubmit={(q) => {
                                    this.setState({
                                        searchQuery: q,
                                    });
                                    performSearch(username, q, searchOrder);
                                }}
                            />
                        </div>
                        <div className="small-4 medium-3 large-4 column">
                            <NativeSelect
                                options={sortOptions}
                                currentlySelected={searchOrder}
                                onChange={(opt) => {
                                    this.setState({
                                        searchOrder: opt.value,
                                    });
                                    performSearch(username, searchQuery, opt.value);
                                }}
                            />
                        </div>
                    </div>
                    <hr />
                    {ordered.size > 0 && (
                        <div>
                            <table>
                                <tbody>
                                    {ordered.map((comm) => {
                                        return row(comm.toJS());
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {ordered.size === 0 && <div>{tt('g.community_search_no_result')}</div>}
                    {communities === null && (
                        <center>
                            <LoadingIndicator style={{ marginBottom: '2rem' }} type="circle" />
                        </center>
                    )}
                </div>
            </PostsIndexLayout>
        );
    }
}

module.exports = {
    path: 'communities(/:username)',
    component: connect(
        (state) => {
            // Get current sort and query from the url.
            return {
                walletUrl: state.app.get('walletUrl'),
                username: state.user.getIn(['current', 'username']),
                communities: state.global.get('community', Map()),
                communities_idx: state.global.get('community_idx', List()),
            };
        },
        (dispatch) => {
            return {
                performSearch: (observer, query, sort = 'rank') => {
                    dispatch(
                        fetchDataSagaActions.listCommunities({
                            observer,
                            query,
                            sort,
                        })
                    );
                },
            };
        }
    )(CommunitiesIndex),
};